import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveSession, getNextDayInSequence } from "@/lib/services/training";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getDashboardStats(userId: string, activeTemplateId: string | null) {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const { count: totalWorkouts } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  const { count: workoutsThisWeek } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", weekStart.toISOString());

  const { count: workoutsThisMonth } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", startOfMonth(now).toISOString());

  const { data: lastSession } = await supabase
    .from("workout_sessions")
    .select("id, name, completed_at, duration_seconds, total_volume_kg")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: recentCompletedDates } = await supabase
    .from("workout_sessions")
    .select("completed_at")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(90);

  const currentStreak = calculateCurrentStreak(
    (recentCompletedDates ?? []).map((s) => s.completed_at as string),
  );

  const { count: prsThisWeek } = await supabase
    .from("personal_records")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("achieved_at", weekStart.toISOString());

  const { data: volumeThisWeekRows } = await supabase
    .from("workout_sessions")
    .select("total_volume_kg")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", weekStart.toISOString());

  const { data: volumeLastWeekRows } = await supabase
    .from("workout_sessions")
    .select("total_volume_kg")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", lastWeekStart.toISOString())
    .lt("completed_at", weekStart.toISOString());

  const volumeThisWeek = (volumeThisWeekRows ?? []).reduce((s, r) => s + r.total_volume_kg, 0);
  const volumeLastWeek = (volumeLastWeekRows ?? []).reduce((s, r) => s + r.total_volume_kg, 0);
  const volumeChangePct = volumeLastWeek > 0 ? ((volumeThisWeek - volumeLastWeek) / volumeLastWeek) * 100 : null;

  const [activeSession, sequence, activeTemplateRow] = await Promise.all([
    getActiveSession(userId),
    activeTemplateId
      ? getNextDayInSequence(userId, activeTemplateId)
      : Promise.resolve({ day: null, nextTrainingDay: null }),
    activeTemplateId
      ? supabase.from("workout_templates").select("id, name").eq("id", activeTemplateId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let pendingDayExerciseCount = 0;
  let pendingDaySetCount = 0;
  if (sequence.day && !sequence.day.is_rest_day) {
    const { data: dayExercises } = await supabase
      .from("workout_template_exercises")
      .select("target_sets")
      .eq("template_day_id", sequence.day.id);
    pendingDayExerciseCount = dayExercises?.length ?? 0;
    pendingDaySetCount = (dayExercises ?? []).reduce((s, r) => s + r.target_sets, 0);
  }

  return {
    totalWorkouts: totalWorkouts ?? 0,
    workoutsThisWeek: workoutsThisWeek ?? 0,
    workoutsThisMonth: workoutsThisMonth ?? 0,
    lastSession,
    currentStreak,
    prsThisWeek: prsThisWeek ?? 0,
    volumeThisWeek,
    volumeChangePct,
    activeSession,
    activeTemplateName: activeTemplateRow.data?.name ?? null,
    pendingDay: sequence.day,
    pendingDayExerciseCount,
    pendingDaySetCount,
    nextTrainingDayIfResting: sequence.nextTrainingDay,
  };
}

// Consecutive calendar days (ending today or yesterday) with at least one
// completed session. Doesn't yet account for a routine's planned rest days.
function calculateCurrentStreak(completedAtDates: string[]): number {
  if (completedAtDates.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(completedAtDates.map((iso) => iso.slice(0, 10))),
  ).sort((a, b) => (a < b ? 1 : -1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let cursor = new Date(today);
  let streak = 0;

  const mostRecent = new Date(uniqueDays[0]);
  const daysSinceLastWorkout = Math.round((today.getTime() - mostRecent.getTime()) / 86_400_000);
  if (daysSinceLastWorkout > 1) return 0;

  for (const day of uniqueDays) {
    const cursorIso = cursor.toISOString().slice(0, 10);
    if (day === cursorIso) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      cursor = new Date(day);
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
