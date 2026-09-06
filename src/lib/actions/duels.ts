"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { createDuelSchema } from "@/lib/validation/duels";
import type { ActionResult } from "@/lib/actions/auth";

export async function createDuelAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createDuelSchema.safeParse({
    opponentId: formData.get("opponentId"),
    metric: formData.get("metric"),
    name: formData.get("name"),
    exerciseId: formData.get("exerciseId") || "",
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
  if (d.metric === "exercise" && !d.exerciseId) {
    return { error: "Selecciona un ejercicio" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  // Only real friends, checked server-side — the picker only ever lists
  // friends, but the id still comes from the browser.
  const { data: friendship } = await supabase.rpc("are_friends", {
    a: profile.id,
    b: d.opponentId,
  });
  if (!friendship) {
    return { error: "Solo puedes retar a un amigo" };
  }

  const today = new Date().toISOString().slice(0, 10);
  const status = d.startDate <= today ? "active" : "upcoming";
  const challengeId = crypto.randomUUID();

  const { error } = await supabase.from("challenges").insert({
    id: challengeId,
    creator_id: profile.id,
    name: d.name,
    metric: d.metric,
    exercise_id: d.metric === "exercise" ? d.exerciseId || null : null,
    is_duel: true,
    start_date: d.startDate,
    end_date: d.endDate,
    status,
  });
  if (error) return { error: "No se pudo crear el duelo" };

  // Both rows inserted here, as the creator — RLS lets the creator insert
  // a participant row for any user_id on a challenge they own, which is
  // what makes this a direct challenge instead of a pending invite.
  const { error: participantsError } = await supabase.from("challenge_participants").insert([
    { challenge_id: challengeId, user_id: profile.id, initial_value: 0, current_value: 0 },
    { challenge_id: challengeId, user_id: d.opponentId, initial_value: 0, current_value: 0 },
  ]);
  if (participantsError) return { error: "No se pudo crear el duelo" };

  revalidatePath("/challenges");
  return { error: null };
}

export async function leaveDuelAction(challengeId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("creator_id")
    .eq("id", challengeId)
    .eq("is_duel", true)
    .maybeSingle();

  if (challenge?.creator_id === profile.id) {
    await supabase.from("challenges").delete().eq("id", challengeId);
  } else {
    await supabase
      .from("challenge_participants")
      .delete()
      .eq("challenge_id", challengeId)
      .eq("user_id", profile.id);
  }

  revalidatePath("/challenges");
}
