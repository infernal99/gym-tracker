import "server-only";
import { createClient } from "@/lib/supabase/server";
import { countCompletedSets } from "@/lib/set-utils";
import { currentStreak, dayKey, daysBetween, startOfWeek } from "@/lib/date-utils";

export interface WeekTotals {
  workouts: number;
  volumeKg: number;
  sets: number;
  minutes: number;
  prs: number;
}

export interface WeeklySummary {
  thisWeek: WeekTotals;
  lastWeek: WeekTotals;
  /** Monday → Sunday of the current week: did the user train that day? */
  weekdaysTrained: boolean[];
  currentStreak: number;
  trainedToday: boolean;
  daysSinceLastWorkout: number | null;
  topExercise: { name: string; slug: string; volumeKg: number } | null;
}

const emptyTotals =(): WeekTotals => ({ workouts: 0, volumeKg: 0, sets: 0, minutes: 0, prs: 0 });

// Everything the dashboard's weekly recap needs, in two round trips: the
// sessions (with their sets, so series are counted per set_number rather
// than per row — see countCompletedSets) and the PRs, both covering this
// week and the previous one so each figure can be shown as a delta.
export async function getWeeklySummary(userId: string): Promise<WeeklySummary> {
  const supabase = await createClient();
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const [{ data: sessions }, { data: prs }, { data: recentSessions }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select(
        `id, completed_at, duration_seconds, total_volume_kg,
         workout_session_exercises(exercises(name, slug), sets(set_number, weight_kg, reps, side))`,
      )
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("completed_at", lastWeekStart.toISOString()),
    supabase
      .from("personal_records")
      .select("achieved_at")
      .eq("user_id", userId)
      .gte("achieved_at", lastWeekStart.toISOString()),
    supabase
      .from("workout_sessions")
      .select("completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(90),
  ]);

  const thisWeek = emptyTotals();
  const lastWeek = emptyTotals();
  const weekdaysTrained = [false, false, false, false, false, false, false];
  const volumeByExercise = new Map<string, { name: string; slug: string; volumeKg: number }>();

  for (const session of sessions ?? []) {
    const completedAt = new Date(session.completed_at as string);
    const isThisWeek = completedAt >= thisWeekStart;
    const bucket = isThisWeek ? thisWeek : lastWeek;

    bucket.workouts += 1;
    bucket.volumeKg += Number(session.total_volume_kg ?? 0);
    bucket.minutes += Math.round((session.duration_seconds ?? 0) / 60);

    for (const sessionExercise of session.workout_session_exercises ?? []) {
      const sets = sessionExercise.sets ?? [];
      bucket.sets += countCompletedSets(sets);

      if (!isThisWeek) continue;
      const exercise = sessionExercise.exercises;
      if (!exercise) continue;
      // Left+right rows of a unilateral set are both real work, so unlike
      // the series count every row contributes to volume here.
      const volumeKg = sets.reduce(
        (sum, s) => sum + Number(s.weight_kg ?? 0) * Number(s.reps ?? 0),
        0,
      );
      const current = volumeByExercise.get(exercise.slug);
      volumeByExercise.set(exercise.slug, {
        name: exercise.name,
        slug: exercise.slug,
        volumeKg: (current?.volumeKg ?? 0) + volumeKg,
      });
    }

    if (isThisWeek) {
      weekdaysTrained[(completedAt.getDay() + 6) % 7] = true;
    }
  }

  for (const pr of prs ?? []) {
    if (new Date(pr.achieved_at as string) >= thisWeekStart) thisWeek.prs += 1;
    else lastWeek.prs += 1;
  }

  const completedDates = (recentSessions ?? []).map((s) => s.completed_at as string);
  const today = new Date();
  const trainedToday = completedDates.some((iso) => dayKey(iso) === dayKey(today));

  const topExercise =
    [...volumeByExercise.values()].sort((a, b) => b.volumeKg - a.volumeKg)[0] ?? null;

  return {
    thisWeek,
    lastWeek,
    weekdaysTrained,
    currentStreak: currentStreak(completedDates),
    trainedToday,
    // recentSessions comes back newest-first, so [0] is the latest one.
    daysSinceLastWorkout: completedDates.length > 0 ? daysBetween(completedDates[0], today) : null,
    topExercise: topExercise && topExercise.volumeKg > 0 ? topExercise : null,
  };
}
