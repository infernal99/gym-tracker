"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { createChallengeSchema } from "@/lib/validation/challenges";
import type { ActionResult } from "@/lib/actions/auth";
import type { Database } from "@/types/database.types";

type ChallengeMetric = Database["public"]["Enums"]["challenge_metric"];

const metricByType: Record<string, ChallengeMetric> = {
  body_weight: "custom",
  exercise: "exercise",
  consistency: "workouts",
};

export async function createChallengeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createChallengeSchema.safeParse({
    type: formData.get("type"),
    name: formData.get("name"),
    exerciseId: formData.get("exerciseId") || "",
    targetValue: formData.get("targetValue"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const d = parsed.data;
  if (d.endDate <= d.startDate) {
    return { error: "La fecha final debe ser posterior a la de inicio" };
  }
  if (d.type === "exercise" && !d.exerciseId) {
    return { error: "Selecciona un ejercicio" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  let initialValue = 0;
  if (d.type === "body_weight") {
    const { data: lastWeight } = await supabase
      .from("body_weight_entries")
      .select("weight_kg")
      .eq("user_id", profile.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    initialValue = lastWeight?.weight_kg ?? profile.initial_weight_kg ?? 0;
  }

  const today = new Date().toISOString().slice(0, 10);
  const status = d.startDate <= today ? "active" : "upcoming";
  const challengeId = crypto.randomUUID();

  const { error } = await supabase.from("challenges").insert({
    id: challengeId,
    creator_id: profile.id,
    name: d.name,
    metric: metricByType[d.type],
    exercise_id: d.type === "exercise" ? d.exerciseId || null : null,
    target_value: d.targetValue,
    start_date: d.startDate,
    end_date: d.endDate,
    status,
  });

  if (error) {
    return { error: "No se pudo crear el reto" };
  }

  const { error: participantError } = await supabase.from("challenge_participants").insert({
    challenge_id: challengeId,
    user_id: profile.id,
    initial_value: initialValue,
    current_value: initialValue,
  });

  if (participantError) {
    return { error: "No se pudo crear el reto" };
  }

  revalidatePath("/challenges");
  return { error: null };
}

export async function deleteChallengeAction(challengeId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.from("challenges").delete().eq("id", challengeId).eq("creator_id", profile.id);

  revalidatePath("/challenges");
}
