import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveSession, getNextDayInSequence } from "@/lib/services/training";
import { currentStreak, startOfWeek } from "@/lib/date-utils";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Enough history for the streak and the week/month windows below. */
const RECENT_WINDOW_DAYS = 120;

export async function getDashboardStats(userId: string, activeTemplateId: string | null) {
  const supabase = await createClient();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const monthStart = startOfMonth(now);
  const recentSince = new Date(now);
  recentSince.setDate(recentSince.getDate() - RECENT_WINDOW_DAYS);

  // One recent-history fetch covers the week count, the month count, the
  // streak and both weekly volumes — these used to be six separate queries,
  // each awaited in turn, so the page paid six sequential round trips for
  // numbers that all come off the same handful of rows.
  const [
    { count: totalWorkouts },
    { data: recentSessions },
    { data: lastSession },
    { count: prsThisWeek },
    activeSession,
    sequence,
    activeTemplateRow,
  ] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase
      .from("workout_sessions")
      .select("completed_at, total_volume_kg")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .gte("completed_at", recentSince.toISOString())
      .order("completed_at", { ascending: false }),
    // Kept separate from the window above so someone coming back after a
    // long break still sees their last session rather than nothing.
    supabase
      .from("workout_sessions")
      .select("id, name, completed_at, duration_seconds, total_volume_kg")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("personal_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("achieved_at", weekStart.toISOString()),
    getActiveSession(userId),
    activeTemplateId
      ? getNextDayInSequence(userId, activeTemplateId)
      : Promise.resolve({ day: null, nextTrainingDay: null }),
    activeTemplateId
      ? supabase.from("workout_templates").select("id, name").eq("id", activeTemplateId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  let workoutsThisWeek = 0;
  let workoutsThisMonth = 0;
  let volumeThisWeek = 0;
  let volumeLastWeek = 0;
  for (const session of recentSessions ?? []) {
    const completedAt = new Date(session.completed_at as string);
    const volume = Number(session.total_volume_kg ?? 0);
    if (completedAt >= weekStart) {
      workoutsThisWeek += 1;
      volumeThisWeek += volume;
    } else if (completedAt >= lastWeekStart) {
      volumeLastWeek += volume;
    }
    if (completedAt >= monthStart) workoutsThisMonth += 1;
  }

  const streak = currentStreak((recentSessions ?? []).map((s) => s.completed_at as string));
  const volumeChangePct =
    volumeLastWeek > 0 ? ((volumeThisWeek - volumeLastWeek) / volumeLastWeek) * 100 : null;

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
    workoutsThisWeek,
    workoutsThisMonth,
    lastSession,
    currentStreak: streak,
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
