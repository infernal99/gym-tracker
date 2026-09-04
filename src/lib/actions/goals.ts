"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { createGoalSchema, updateGoalProgressSchema } from "@/lib/validation/goals";
import type { ActionResult } from "@/lib/actions/auth";

export async function createGoalAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createGoalSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    exerciseId: formData.get("exerciseId") || "",
    initialValue: formData.get("initialValue") || "",
    targetValue: formData.get("targetValue"),
    unit: formData.get("unit"),
    targetDate: formData.get("targetDate") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  const d = parsed.data;
  const initialValue = d.initialValue === "" ? null : d.initialValue;

  const { error } = await supabase.from("goals").insert({
    user_id: profile.id,
    type: d.type,
    title: d.title,
    exercise_id: d.exerciseId || null,
    initial_value: initialValue,
    current_value: initialValue,
    target_value: d.targetValue,
    unit: d.unit,
    target_date: d.targetDate || null,
  });

  if (error) {
    return { error: "No se pudo crear el objetivo" };
  }

  revalidatePath("/goals");
  return { error: null };
}

export async function updateGoalProgressAction(
  goalId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateGoalProgressSchema.safeParse({
    currentValue: formData.get("currentValue"),
  });

  if (!parsed.success) {
    return { error: "Valor no válido" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: goal } = await supabase
    .from("goals")
    .select("title, initial_value, target_value, status")
    .eq("id", goalId)
    .eq("user_id", profile.id)
    .single();

  if (!goal) return { error: "Objetivo no encontrado" };

  const initial = goal.initial_value ?? 0;
  const target = goal.target_value;
  const current = parsed.data.currentValue;
  const reachedGoal = target >= initial ? current >= target : current <= target;

  const { error } = await supabase
    .from("goals")
    .update({
      current_value: current,
      status: reachedGoal ? "completed" : "active",
      completed_at: reachedGoal ? new Date().toISOString() : null,
    })
    .eq("id", goalId)
    .eq("user_id", profile.id);

  if (error) {
    return { error: "No se pudo actualizar el objetivo" };
  }

  if (reachedGoal) {
    await supabase.from("activity_feed").insert({
      user_id: profile.id,
      type: "goal_completed",
      related_type: "goal",
      related_id: goalId,
      metadata: { title: goal.title },
    });
    await supabase.rpc("evaluate_achievements", { p_user_id: profile.id });
    revalidatePath("/achievements");
  }

  revalidatePath("/goals");
  return { error: null };
}

export async function deleteGoalAction(goalId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.from("goals").delete().eq("id", goalId).eq("user_id", profile.id);

  revalidatePath("/goals");
}
