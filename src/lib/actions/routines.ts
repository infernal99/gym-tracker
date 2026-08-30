"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { templateSchema, daySchema, templateExerciseSchema } from "@/lib/validation/routines";
import type { ActionResult } from "@/lib/actions/auth";

export async function createTemplateAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = templateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workout_templates")
    .insert({
      user_id: profile.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "No se pudo crear la rutina" };
  }

  redirect(`/routines/${data.id}`);
}

export async function deleteTemplateAction(templateId: string) {
  const supabase = await createClient();
  await supabase.from("workout_templates").delete().eq("id", templateId);
  revalidatePath("/routines");
  redirect("/routines");
}

export async function toggleArchiveTemplateAction(templateId: string, archived: boolean) {
  const supabase = await createClient();
  await supabase.from("workout_templates").update({ is_archived: archived }).eq("id", templateId);
  revalidatePath("/routines");
}

export async function duplicateTemplateAction(templateId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("workout_templates")
    .select("*, workout_template_days(*, workout_template_exercises(*))")
    .eq("id", templateId)
    .single();

  if (!original) return;

  const { data: copy } = await supabase
    .from("workout_templates")
    .insert({
      user_id: profile.id,
      name: `${original.name} (copia)`,
      description: original.description,
    })
    .select("id")
    .single();

  if (!copy) return;

  for (const day of original.workout_template_days ?? []) {
    const { data: newDay } = await supabase
      .from("workout_template_days")
      .insert({
        template_id: copy.id,
        day_order: day.day_order,
        name: day.name,
        is_rest_day: day.is_rest_day,
      })
      .select("id")
      .single();

    if (!newDay) continue;

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

  revalidatePath("/routines");
  redirect(`/routines/${copy.id}`);
}

export async function addDayAction(templateId: string, formData: FormData) {
  const parsed = daySchema.safeParse({
    name: formData.get("name"),
    isRestDay: formData.get("isRestDay") === "on",
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

  await supabase.from("workout_template_days").insert({
    template_id: templateId,
    day_order: nextOrder,
    name: parsed.data.name,
    is_rest_day: parsed.data.isRestDay,
  });

  revalidatePath(`/routines/${templateId}`);
}

export async function deleteDayAction(dayId: string, templateId: string) {
  const supabase = await createClient();
  await supabase.from("workout_template_days").delete().eq("id", dayId);
  revalidatePath(`/routines/${templateId}`);
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
}

export async function removeTemplateExerciseAction(rowId: string, templateId: string) {
  const supabase = await createClient();
  await supabase.from("workout_template_exercises").delete().eq("id", rowId);
  revalidatePath(`/routines/${templateId}`);
}
