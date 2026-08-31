"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { templateSchema, daySchema, templateExerciseSchema } from "@/lib/validation/routines";

export async function createTemplateAction(formData: FormData) {
  const parsed = templateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return;

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .insert({
      user_id: profile.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (!data) return;

  redirect(`/routines/${data.id}/setup`);
}

export async function setActiveTemplateAction(templateId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ active_template_id: templateId })
    .eq("id", profile.id);

  revalidatePath("/my-routine");
  redirect("/my-routine");
}

export async function deleteTemplateAction(templateId: string) {
  const supabase = await createClient();
  await supabase.from("workout_templates").delete().eq("id", templateId).eq("is_public", false);
  revalidatePath("/routines");
  redirect("/routines");
}

export async function toggleArchiveTemplateAction(templateId: string, archived: boolean) {
  const supabase = await createClient();
  await supabase.from("workout_templates").update({ is_archived: archived }).eq("id", templateId);
  revalidatePath("/routines");
}

async function copyTemplate(templateId: string, name: string, includeExercises: boolean) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("workout_templates")
    .select("*, workout_template_days(*, workout_template_exercises(*))")
    .eq("id", templateId)
    .single();

  if (!original) return null;

  const { data: copy } = await supabase
    .from("workout_templates")
    .insert({
      user_id: profile.id,
      name,
      description: original.description,
    })
    .select("id")
    .single();

  if (!copy) return null;

  for (const day of original.workout_template_days ?? []) {
    const { data: newDay } = await supabase
      .from("workout_template_days")
      .insert({
        template_id: copy.id,
        day_order: day.day_order,
        name: day.name,
        is_rest_day: day.is_rest_day,
        muscle_group_ids: day.muscle_group_ids,
      })
      .select("id")
      .single();

    if (!newDay || !includeExercises) continue;

    const exercises = (day.workout_template_exercises ?? []).map((ex) => ({
      template_day_id: newDay.id,
      exercise_id: ex.exercise_id,
      order_index: ex.order_index,
      target_sets: ex.target_sets,
      target_reps_min: ex.target_reps_min,
      target_reps_max: ex.target_reps_max,
      target_weight_kg: ex.target_weight_kg,
      target_rir: ex.target_rir,
      target_rpe: ex.target_rpe,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes,
    }));

    if (exercises.length > 0) {
      await supabase.from("workout_template_exercises").insert(exercises);
    }
  }

  return copy.id;
}

export async function duplicateTemplateAction(templateId: string) {
  const supabase = await createClient();
  const { data: original } = await supabase
    .from("workout_templates")
    .select("name")
    .eq("id", templateId)
    .single();

  const copyId = await copyTemplate(templateId, `${original?.name ?? "Rutina"} (copia)`, true);
  if (!copyId) return;

  revalidatePath("/routines");
  redirect(`/routines/${copyId}`);
}

// Plantillas públicas se copian sin ejercicios: solo se toma la estructura
// de días y grupos musculares, y el usuario añade sus propios ejercicios
// en el asistente.
export async function useTemplateAction(templateId: string) {
  const supabase = await createClient();
  const { data: original } = await supabase
    .from("workout_templates")
    .select("name")
    .eq("id", templateId)
    .single();

  const copyId = await copyTemplate(templateId, original?.name ?? "Mi rutina", false);
  if (!copyId) return;

  revalidatePath("/routines");
  redirect(`/routines/${copyId}/setup`);
}

export async function addDayAction(templateId: string, formData: FormData) {
  const parsed = daySchema.safeParse({
    name: formData.get("name"),
    isRestDay: formData.get("isRestDay") === "on",
    muscleGroupIds: formData.getAll("muscleGroupIds"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: existingDays } = await supabase
    .from("workout_template_days")
    .select("day_order")
    .eq("template_id", templateId)
    .order("day_order", { ascending: false })
    .limit(1);

  const nextOrder = (existingDays?.[0]?.day_order ?? 0) + 1;

  const { data: newDay } = await supabase
    .from("workout_template_days")
    .insert({
      template_id: templateId,
      day_order: nextOrder,
      name: parsed.data.name,
      is_rest_day: parsed.data.isRestDay,
      muscle_group_ids: parsed.data.muscleGroupIds,
    })
    .select("id")
    .single();

  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);

  if (formData.get("fromSetup") === "1" && newDay) {
    redirect(`/routines/${templateId}/setup?day=${newDay.id}`);
  }
}

// Copia los ejercicios de un día ya montado a otro (p. ej. un día que
// repite el mismo enfoque muscular), como punto de partida editable.
export async function copyDayExercisesAction(
  sourceDayId: string,
  targetDayId: string,
  templateId: string,
) {
  const supabase = await createClient();
  const [{ data: sourceExercises }, { data: existing }] = await Promise.all([
    supabase
      .from("workout_template_exercises")
      .select("*")
      .eq("template_day_id", sourceDayId)
      .order("order_index"),
    supabase
      .from("workout_template_exercises")
      .select("order_index")
      .eq("template_day_id", targetDayId)
      .order("order_index", { ascending: false })
      .limit(1),
  ]);

  if (!sourceExercises || sourceExercises.length === 0) return;

  let nextOrder = (existing?.[0]?.order_index ?? -1) + 1;
  const copies = sourceExercises.map((ex) => ({
    template_day_id: targetDayId,
    exercise_id: ex.exercise_id,
    order_index: nextOrder++,
    target_sets: ex.target_sets,
    target_reps_min: ex.target_reps_min,
    target_reps_max: ex.target_reps_max,
    target_weight_kg: ex.target_weight_kg,
    target_rir: ex.target_rir,
    target_rpe: ex.target_rpe,
    rest_seconds: ex.rest_seconds,
    notes: ex.notes,
  }));

  await supabase.from("workout_template_exercises").insert(copies);

  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
}

export async function deleteDayAction(dayId: string, templateId: string) {
  const supabase = await createClient();
  await supabase.from("workout_template_days").delete().eq("id", dayId);
  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
}

export async function addTemplateExerciseAction(
  dayId: string,
  templateId: string,
  formData: FormData,
) {
  const parsed = templateExerciseSchema.safeParse({
    exerciseId: formData.get("exerciseId"),
    targetSets: formData.get("targetSets"),
    targetRepsMin: formData.get("targetRepsMin") || "",
    targetRepsMax: formData.get("targetRepsMax") || "",
    targetWeightKg: formData.get("targetWeightKg") || "",
    targetRir: formData.get("targetRir") || "",
    restSeconds: formData.get("restSeconds") || 90,
    notes: formData.get("notes") || "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("workout_template_exercises")
    .select("order_index")
    .eq("template_day_id", dayId)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;

  await supabase.from("workout_template_exercises").insert({
    template_day_id: dayId,
    exercise_id: parsed.data.exerciseId,
    order_index: nextOrder,
    target_sets: parsed.data.targetSets,
    target_reps_min: parsed.data.targetRepsMin || null,
    target_reps_max: parsed.data.targetRepsMax || null,
    target_weight_kg: parsed.data.targetWeightKg || null,
    target_rir: parsed.data.targetRir || null,
    rest_seconds: parsed.data.restSeconds,
    notes: parsed.data.notes || null,
  });

  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
}

export async function removeTemplateExerciseAction(rowId: string, templateId: string) {
  const supabase = await createClient();
  await supabase.from("workout_template_exercises").delete().eq("id", rowId);
  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
}
