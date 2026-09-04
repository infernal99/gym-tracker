"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { findUserFork } from "@/lib/services/routines";
import { templateSchema, daySchema, templateExerciseSchema } from "@/lib/validation/routines";
import { REST_DAY_SENTINEL } from "@/lib/routines-constants";
import type { Database } from "@/types/database.types";

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

export async function renameTemplateAction(templateId: string, formData: FormData) {
  const parsed = templateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("workout_templates")
    .update({ name: parsed.data.name, description: parsed.data.description || null })
    .eq("id", templateId);

  revalidatePath("/my-routine");
  revalidatePath(`/routines/${templateId}`);
  revalidatePath("/routines");
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

// Copies every day (and optionally its exercises) from one template onto
// another, already-created one — shared by copyTemplate (new target row)
// and resetTemplateToOriginalAction (existing target row, days wiped first).
async function copyDaysAndExercises(
  supabase: SupabaseClient<Database>,
  sourceTemplateId: string,
  targetTemplateId: string,
  includeExercises: boolean,
) {
  const { data: sourceDays } = await supabase
    .from("workout_template_days")
    .select("*, workout_template_exercises(*)")
    .eq("template_id", sourceTemplateId)
    .order("day_order");

  for (const day of sourceDays ?? []) {
    const { data: newDay } = await supabase
      .from("workout_template_days")
      .insert({
        template_id: targetTemplateId,
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
      is_unilateral: ex.is_unilateral,
      rest_between_sides_seconds: ex.rest_between_sides_seconds,
      notes: ex.notes,
    }));

    if (exercises.length > 0) {
      await supabase.from("workout_template_exercises").insert(exercises);
    }
  }
}

async function copyTemplate(
  templateId: string,
  name: string,
  includeExercises: boolean,
  forkedFromId?: string,
) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("workout_templates")
    .select("description")
    .eq("id", templateId)
    .single();

  if (!original) return null;

  const { data: copy } = await supabase
    .from("workout_templates")
    .insert({
      user_id: profile.id,
      name,
      description: original.description,
      forked_from_id: forkedFromId ?? null,
    })
    .select("id")
    .single();

  if (!copy) return null;

  await copyDaysAndExercises(supabase, templateId, copy.id, includeExercises);

  return copy.id;
}

// A "De serie" template must look the same to everyone, so it can't be
// edited in place — the first time anyone (owner included) tries to change
// one, they get their own private, fully independent copy instead. Reuses
// an existing fork rather than creating a second one on repeat visits.
export async function personalizeTemplateAction(templateId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const existingFork = await findUserFork(profile.id, templateId);
  if (existingFork) redirect(`/routines/${existingFork.id}`);

  const { data: original } = await supabase
    .from("workout_templates")
    .select("name")
    .eq("id", templateId)
    .single();

  const copyId = await copyTemplate(templateId, original?.name ?? "Rutina", true, templateId);
  if (!copyId) redirect(`/routines/${templateId}`);

  revalidatePath("/routines");
  redirect(`/routines/${copyId}`);
}

// Discards every local change to a personalized copy and re-copies the
// current state of its "De serie" source back in — a full reset, not a
// merge, so a stray edit can't be half-undone into a broken mix of both.
export async function resetTemplateToOriginalAction(templateId: string) {
  const supabase = await createClient();
  const { data: template } = await supabase
    .from("workout_templates")
    .select("forked_from_id")
    .eq("id", templateId)
    .single();

  if (!template?.forked_from_id) return;

  const { data: original } = await supabase
    .from("workout_templates")
    .select("name, description")
    .eq("id", template.forked_from_id)
    .single();

  if (!original) return;

  // Cascades to workout_template_exercises and workout_template_weekday_slots.
  await supabase.from("workout_template_days").delete().eq("template_id", templateId);

  await supabase
    .from("workout_templates")
    .update({ name: original.name, description: original.description })
    .eq("id", templateId);

  await copyDaysAndExercises(supabase, template.forked_from_id, templateId, true);

  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
  revalidatePath("/my-routine");
  revalidatePath("/routines");
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

// Returns the routine's share token, generating one the first time it's
// needed — a template with no token yet just hasn't been shared before.
export async function getOrCreateShareTokenAction(templateId: string): Promise<string | null> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("workout_templates")
    .select("share_token")
    .eq("id", templateId)
    .eq("user_id", profile.id)
    .single();

  if (!template) return null;
  if (template.share_token) return template.share_token;

  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("workout_templates")
    .update({ share_token: token })
    .eq("id", templateId)
    .eq("user_id", profile.id);

  return error ? null : token;
}

export async function shareTemplateWithFriendAction(templateId: string, friendId: string): Promise<void> {
  const profile = await requireProfile();
  const token = await getOrCreateShareTokenAction(templateId);
  if (!token) return;

  const supabase = await createClient();
  await supabase.from("template_shares").insert({
    template_id: templateId,
    share_token: token,
    shared_by: profile.id,
    shared_with: friendId,
  });

  revalidatePath(`/routines/${templateId}`);
}

export async function dismissTemplateShareAction(shareId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("template_shares").delete().eq("id", shareId);
  revalidatePath("/routines");
}

// Clones a shared routine into the caller's own account via the token-gated
// RPC (see migration routine_sharing) — no direct read access to the
// source template is needed, so this works whether the share came through
// an in-app "compartir con amigo" or a copied link.
export async function forkSharedTemplateAction(token: string): Promise<void> {
  await requireProfile();
  const supabase = await createClient();
  const { data: newId, error } = await supabase.rpc("fork_shared_template", { p_token: token });
  if (error || !newId) return;

  revalidatePath("/routines");
  redirect(`/routines/${newId}`);
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
  revalidatePath("/my-routine");

  if (formData.get("fromSetup") === "1" && newDay) {
    redirect(`/routines/${templateId}/setup?day=${newDay.id}`);
  }
}

export async function updateDayAction(dayId: string, templateId: string, formData: FormData) {
  const parsed = daySchema.safeParse({
    name: formData.get("name"),
    isRestDay: formData.get("isRestDay") === "on",
    muscleGroupIds: formData.getAll("muscleGroupIds"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("workout_template_days")
    .update({
      name: parsed.data.name,
      is_rest_day: parsed.data.isRestDay,
      muscle_group_ids: parsed.data.muscleGroupIds,
    })
    .eq("id", dayId);

  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
  revalidatePath("/my-routine");
}

// Points a weekday (0=lunes..6=domingo) at a day for the drag-and-drop
// calendar on Mi rutina. Unlike the old 1:1 model, the same day can occupy
// several weekdays (e.g. "Piernas" on martes AND viernes) — only the
// weekday slot itself is unique, so dropping a day never removes it from
// anywhere else it's scheduled.
export async function assignWeekdayAction(
  weekday: number,
  templateId: string,
  dayId: string,
) {
  if (weekday < 0 || weekday > 6) return;

  const supabase = await createClient();

  let resolvedDayId = dayId;
  if (dayId === REST_DAY_SENTINEL) {
    const { data } = await supabase.rpc("ensure_default_rest_day", {
      p_template_id: templateId,
    });
    if (!data) return;
    resolvedDayId = data;
  }

  await supabase
    .from("workout_template_weekday_slots")
    .upsert(
      { template_id: templateId, weekday, day_id: resolvedDayId },
      { onConflict: "template_id,weekday" },
    );

  revalidatePath("/my-routine");
  revalidatePath(`/routines/${templateId}`);
}

export async function unassignWeekdayAction(templateId: string, weekday: number) {
  const supabase = await createClient();
  await supabase
    .from("workout_template_weekday_slots")
    .delete()
    .eq("template_id", templateId)
    .eq("weekday", weekday);

  revalidatePath("/my-routine");
  revalidatePath(`/routines/${templateId}`);
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
    is_unilateral: ex.is_unilateral,
    rest_between_sides_seconds: ex.rest_between_sides_seconds,
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
    restSeconds: formData.get("restSeconds") || 180,
    isUnilateral: formData.get("isUnilateral") === "on",
    restBetweenSidesSeconds: formData.get("restBetweenSidesSeconds") || 60,
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
    is_unilateral: parsed.data.isUnilateral,
    rest_between_sides_seconds: parsed.data.restBetweenSidesSeconds,
    notes: parsed.data.notes || null,
  });

  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
  revalidatePath("/my-routine");
}

export async function updateTemplateExerciseAction(
  rowId: string,
  templateId: string,
  formData: FormData,
) {
  const parsed = templateExerciseSchema
    .omit({ exerciseId: true })
    .safeParse({
      targetSets: formData.get("targetSets"),
      targetRepsMin: formData.get("targetRepsMin") || "",
      targetRepsMax: formData.get("targetRepsMax") || "",
      targetWeightKg: formData.get("targetWeightKg") || "",
      targetRir: formData.get("targetRir") || "",
      restSeconds: formData.get("restSeconds") || 180,
      isUnilateral: formData.get("isUnilateral") === "on",
      restBetweenSidesSeconds: formData.get("restBetweenSidesSeconds") || 60,
      notes: formData.get("notes") || "",
    });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("workout_template_exercises")
    .update({
      target_sets: parsed.data.targetSets,
      target_reps_min: parsed.data.targetRepsMin || null,
      target_reps_max: parsed.data.targetRepsMax || null,
      target_weight_kg: parsed.data.targetWeightKg || null,
      target_rir: parsed.data.targetRir || null,
      rest_seconds: parsed.data.restSeconds,
      is_unilateral: parsed.data.isUnilateral,
      rest_between_sides_seconds: parsed.data.restBetweenSidesSeconds,
      notes: parsed.data.notes || null,
    })
    .eq("id", rowId);

  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
  revalidatePath("/my-routine");
}

export async function removeTemplateExerciseAction(rowId: string, templateId: string) {
  const supabase = await createClient();
  await supabase.from("workout_template_exercises").delete().eq("id", rowId);
  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
  revalidatePath("/my-routine");
}

// Persists a drag-and-drop reorder of a day's exercises — orderedIds is the
// full list of that day's workout_template_exercises rows in their new
// order. workout_template_exercises has a unique (template_day_id,
// order_index) constraint, so swapping two rows' positions directly would
// transiently collide (row A can't move into row B's slot before B moves
// out) — parking everything at negative, guaranteed-unique positions first
// avoids that.
export async function reorderTemplateExercisesAction(
  templateId: string,
  orderedIds: string[],
) {
  const supabase = await createClient();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("workout_template_exercises")
        .update({ order_index: -(index + 1) })
        .eq("id", id),
    ),
  );
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("workout_template_exercises").update({ order_index: index }).eq("id", id),
    ),
  );
  revalidatePath(`/routines/${templateId}`);
  revalidatePath(`/routines/${templateId}/setup`);
  revalidatePath("/my-routine");
}
