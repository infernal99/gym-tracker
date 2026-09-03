import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Challenge } from "@/lib/challenge-utils";

const todayIso = () => new Date().toISOString().slice(0, 10);

async function computeCurrentValue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  metric: string,
  exerciseId: string | null,
  startDate: string,
): Promise<number | null> {
  if (metric === "exercise" && exerciseId) {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("id, workout_session_exercises!inner(exercise_id, sets(weight_kg, reps))")
      .eq("user_id", userId)
      .eq("workout_session_exercises.exercise_id", exerciseId)
      .not("completed_at", "is", null)
      .gte("completed_at", startDate);

    let best = 0;
    for (const s of sessions ?? []) {
      for (const se of s.workout_session_exercises) {
        for (const set of se.sets) {
          if (set.weight_kg != null && set.reps != null) {
            best = Math.max(best, set.weight_kg);
          }
        }
      }
    }
    return best;
  }

  if (metric === "workouts" || metric === "consistency") {
    const { count } = await supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("completed_at", startDate);
    return count ?? 0;
  }

  if (metric === "custom") {
    const { data } = await supabase
      .from("body_weight_entries")
      .select("weight_kg")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.weight_kg ?? null;
  }

  return null;
}

export async function listChallenges(userId: string): Promise<Challenge[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("challenges")
    .select("*, exercises(name), challenge_participants!inner(current_value, initial_value)")
    .eq("creator_id", userId)
    .eq("challenge_participants.user_id", userId)
    .order("created_at", { ascending: false });

  const results: Challenge[] = [];

  for (const row of rows ?? []) {
    const participant = row.challenge_participants[0];
    const computed = await computeCurrentValue(
      supabase,
      userId,
      row.metric,
      row.exercise_id,
      row.start_date,
    );
    const currentValue = computed ?? participant.current_value;

    if (computed !== null && computed !== participant.current_value) {
      await supabase
        .from("challenge_participants")
        .update({ current_value: computed })
        .eq("challenge_id", row.id)
        .eq("user_id", userId);
    }

    const target = row.target_value ?? 0;
    const initial = participant.initial_value;
    const reached = target >= initial ? currentValue >= target : currentValue <= target;

    if (reached && row.status !== "completed") {
      await supabase.from("challenges").update({ status: "completed" }).eq("id", row.id);
    } else if (!reached && row.end_date < todayIso() && row.status === "active") {
      // Left as "active" but the UI treats a past end_date as expired —
      // no separate write needed since daysRemaining() already derives it.
    }

    results.push({
      id: row.id,
      name: row.name,
      metric: row.metric,
      exerciseName: row.exercises?.name ?? null,
      initialValue: initial,
      targetValue: target,
      currentValue,
      startDate: row.start_date,
      endDate: row.end_date,
      status: reached ? "completed" : row.status,
    });
  }

  return results;
}
