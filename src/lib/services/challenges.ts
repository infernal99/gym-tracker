import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Challenge } from "@/lib/challenge-utils";
import { longestStreak } from "@/lib/date-utils";

// Exported so group challenges (which need this per-participant, not just
// for the viewer) can reuse the exact same metric definitions instead of a
// second implementation that could quietly drift from this one.
export async function computeChallengeValue(
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

  if (metric === "volume") {
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("total_volume_kg")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("completed_at", startDate);
    return (sessions ?? []).reduce((sum, s) => sum + Number(s.total_volume_kg ?? 0), 0);
  }

  if (metric === "streak") {
    // Longest run achieved *during the challenge window*, not the streak
    // right now — someone who built a 10-day streak in week one and then
    // broke it should still be shown as having reached 10, matching "quién
    // mantiene la racha más larga" rather than "quién está en racha hoy".
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("completed_at", startDate);
    return longestStreak((sessions ?? []).map((s) => s.completed_at as string));
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

  // Each challenge's current value needs its own query, and reaching the
  // target writes back — but nothing here depends on another challenge, so
  // they run together rather than one full round trip after another.
  // Promise.all preserves order, so the list stays sorted as queried.
  return Promise.all(
    (rows ?? []).map(async (row): Promise<Challenge> => {
      const participant = row.challenge_participants[0];
      const computed = await computeChallengeValue(
        supabase,
        userId,
        row.metric,
        row.exercise_id,
        row.start_date,
      );
      const currentValue = computed ?? participant.current_value;

      const target = row.target_value ?? 0;
      const initial = participant.initial_value;
      const reached = target >= initial ? currentValue >= target : currentValue <= target;

      await Promise.all([
        computed !== null && computed !== participant.current_value
          ? supabase
              .from("challenge_participants")
              .update({ current_value: computed })
              .eq("challenge_id", row.id)
              .eq("user_id", userId)
          : null,
        // A challenge past its end date without reaching the target stays
        // "active" — the UI derives "expired" from end_date via
        // daysRemaining(), so there's nothing to write.
        reached && row.status !== "completed"
          ? supabase.from("challenges").update({ status: "completed" }).eq("id", row.id)
          : null,
      ]);

      return {
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
      };
    }),
  );
}
