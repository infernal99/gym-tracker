import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getActiveSession, getNextDayInSequence } from "@/lib/services/training";
import { currentStreak, startOfWeek } from "@/lib/date-utils";

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

  const streak = currentStreak((recentCompletedDates ?? []).map((s) => s.completed_at as string));

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
