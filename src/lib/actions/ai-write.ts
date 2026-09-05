"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { templateSchema, daySchema, templateExerciseSchema } from "@/lib/validation/routines";
import { createGoalSchema } from "@/lib/validation/goals";
import type {
  GoalProposal,
  ProposalExercise,
  RoutineChangeProposal,
  RoutineProposal,
} from "@/lib/ai/proposals";

export type AIWriteResult =
  | { ok: true; templateId?: string }
  | { ok: false; error: string };

// Proposals travel through the browser, so nothing here trusts them:
// exercise ids are checked against the real table, every field goes back
// through the same zod schemas the manual forms use, and any routine or day
// referenced has to belong to the signed-in user.

async function fetchRealExercises(exerciseIds: string[]) {
  if (exerciseIds.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("id, primary_muscle_group_id")
    .in("id", [...new Set(exerciseIds)]);
  return new Map((data ?? []).map((e) => [e.id, e.primary_muscle_group_id]));
}

function validateExercise(exercise: ProposalExercise) {
  return templateExerciseSchema.safeParse({
    exerciseId: exercise.exerciseId,
    targetSets: exercise.targetSets,
    targetRepsMin: exercise.targetRepsMin ?? "",
    targetRepsMax: exercise.targetRepsMax ?? "",
    targetWeightKg: "",
    targetRir: "",
    restSeconds: 180,
    isUnilateral: false,
    restBetweenSidesSeconds: 60,
    notes: "",
  });
}

export async function createRoutineFromProposalAction(
  proposal: RoutineProposal,
  activate: boolean,
): Promise<AIWriteResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const parsedTemplate = templateSchema.safeParse({
    name: proposal.name,
    description: proposal.description ?? "",
  });
  if (!parsedTemplate.success) return { ok: false, error: "El nombre de la rutina no es válido" };

  const allExerciseIds = proposal.days.flatMap((d) => d.exercises.map((e) => e.exerciseId));
  const realExercises = await fetchRealExercises(allExerciseIds);
  if (realExercises.size === 0) return { ok: false, error: "Los ejercicios propuestos no existen" };

  const { data: template } = await supabase
    .from("workout_templates")
    .insert({
      user_id: profile.id,
      name: parsedTemplate.data.name,
      description: parsedTemplate.data.description || null,
    })
    .select("id")
    .single();
  if (!template) return { ok: false, error: "No se pudo crear la rutina" };

  let dayOrder = 0;
  for (const day of proposal.days) {
    const exercises = day.exercises.filter((e) => realExercises.has(e.exerciseId));
    if (exercises.length === 0) continue;

    // Tag the day with the muscle groups its exercises actually train, so
    // it behaves like a hand-built day everywhere else in the app.
    const muscleGroupIds = [
      ...new Set(
        exercises
          .map((e) => realExercises.get(e.exerciseId))
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const parsedDay = daySchema.safeParse({
      name: day.name,
      isRestDay: false,
      muscleGroupIds,
    });
    if (!parsedDay.success) continue;

    dayOrder += 1;
    const { data: insertedDay } = await supabase
      .from("workout_template_days")
      .insert({
        template_id: template.id,
        day_order: dayOrder,
        name: parsedDay.data.name,
        is_rest_day: false,
        muscle_group_ids: parsedDay.data.muscleGroupIds,
      })
      .select("id")
      .single();
    if (!insertedDay) continue;

    const rows = exercises.flatMap((exercise, index) => {
      const parsed = validateExercise(exercise);
      if (!parsed.success) return [];
      return [
        {
          template_day_id: insertedDay.id,
          exercise_id: parsed.data.exerciseId,
          order_index: index,
          target_sets: parsed.data.targetSets,
          target_reps_min: parsed.data.targetRepsMin || null,
          target_reps_max: parsed.data.targetRepsMax || null,
          target_weight_kg: null,
          target_rir: null,
          rest_seconds: parsed.data.restSeconds,
          is_unilateral: false,
          rest_between_sides_seconds: parsed.data.restBetweenSidesSeconds,
          notes: null,
        },
      ];
    });

    if (rows.length > 0) await supabase.from("workout_template_exercises").insert(rows);
  }

  if (activate) {
    await supabase
      .from("profiles")
      .update({ active_template_id: template.id })
      .eq("id", profile.id);
  }

  revalidatePath("/routines");
  revalidatePath("/my-routine");
  return { ok: true, templateId: template.id };
}

export async function activateRoutineAction(templateId: string): Promise<AIWriteResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("id", templateId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!template) return { ok: false, error: "Esa rutina no es tuya" };

  await supabase
    .from("profiles")
    .update({ active_template_id: templateId })
    .eq("id", profile.id);

  revalidatePath("/my-routine");
  revalidatePath("/dashboard");
  return { ok: true, templateId };
}

export async function createGoalFromProposalAction(proposal: GoalProposal): Promise<AIWriteResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const parsed = createGoalSchema.safeParse({
    type: proposal.type,
    title: proposal.title,
    exerciseId: proposal.exerciseId ?? "",
    initialValue: proposal.currentValue ?? "",
    targetValue: proposal.targetValue,
    unit: proposal.unit,
    targetDate: "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Objetivo no válido" };
  }

  const initialValue = parsed.data.initialValue === "" ? null : parsed.data.initialValue;
  const { error } = await supabase.from("goals").insert({
    user_id: profile.id,
    type: parsed.data.type,
    title: parsed.data.title,
    exercise_id: parsed.data.exerciseId || null,
    initial_value: initialValue,
    current_value: initialValue,
    target_value: parsed.data.targetValue,
    unit: parsed.data.unit,
    target_date: null,
  });
  if (error) return { ok: false, error: "No se pudo crear el objetivo" };

  revalidatePath("/goals");
  return { ok: true };
}

export async function applyRoutineChangeAction(
  proposal: RoutineChangeProposal,
): Promise<AIWriteResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  // The day must belong to a routine this user owns — checked here rather
  // than trusting the ids that came back from the browser.
  const { data: day } = await supabase
    .from("workout_template_days")
    .select("id, muscle_group_ids, workout_templates!inner(id, user_id)")
    .eq("id", proposal.dayId)
    .eq("workout_templates.user_id", profile.id)
    .maybeSingle();
  if (!day) return { ok: false, error: "Ese día no pertenece a ninguna rutina tuya" };

  if (proposal.remove.length > 0) {
    await supabase
      .from("workout_template_exercises")
      .delete()
      .eq("template_day_id", proposal.dayId)
      .in(
        "id",
        proposal.remove.map((r) => r.rowId),
      );
  }

  if (proposal.add.length > 0) {
    const realExercises = await fetchRealExercises(proposal.add.map((e) => e.exerciseId));

    const { data: existing } = await supabase
      .from("workout_template_exercises")
      .select("order_index")
      .eq("template_day_id", proposal.dayId)
      .order("order_index", { ascending: false })
      .limit(1);
    let nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

    const rows = proposal.add.flatMap((exercise) => {
      if (!realExercises.has(exercise.exerciseId)) return [];
      const parsed = validateExercise(exercise);
      if (!parsed.success) return [];
      const row = {
        template_day_id: proposal.dayId,
        exercise_id: parsed.data.exerciseId,
        order_index: nextOrder,
        target_sets: parsed.data.targetSets,
        target_reps_min: parsed.data.targetRepsMin || null,
        target_reps_max: parsed.data.targetRepsMax || null,
        target_weight_kg: null,
        target_rir: null,
        rest_seconds: parsed.data.restSeconds,
        is_unilateral: false,
        rest_between_sides_seconds: parsed.data.restBetweenSidesSeconds,
        notes: null,
      };
      nextOrder += 1;
      return [row];
    });

    if (rows.length > 0) {
      await supabase.from("workout_template_exercises").insert(rows);

      // Same rule the manual "add exercise" flow follows: widen the day's
      // tags when an exercise trains something outside them.
      const newGroups = [
        ...new Set(
          proposal.add
            .map((e) => realExercises.get(e.exerciseId))
            .filter((id): id is string => Boolean(id) && !day.muscle_group_ids.includes(id!)),
        ),
      ];
      if (newGroups.length > 0) {
        await supabase
          .from("workout_template_days")
          .update({ muscle_group_ids: [...day.muscle_group_ids, ...newGroups] })
          .eq("id", proposal.dayId);
      }
    }
  }

  revalidatePath(`/routines/${proposal.templateId}`);
  revalidatePath("/my-routine");
  return { ok: true, templateId: proposal.templateId };
}
