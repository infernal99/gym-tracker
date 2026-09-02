import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getActiveSession(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("id, name, started_at")
    .eq("user_id", userId)
    .is("completed_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// The routine is a sequence, not a calendar: "next" is whatever comes after
// the day of the last completed session for this template, wrapping around.
// If nothing has been completed yet, it starts at day 1.
export async function getNextDayInSequence(userId: string, templateId: string) {
  const supabase = await createClient();
  const { data: days } = await supabase
    .from("workout_template_days")
    .select("*")
    .eq("template_id", templateId)
    .order("day_order");

  if (!days || days.length === 0) return { day: null, nextTrainingDay: null };

  const { data: lastSession } = await supabase
    .from("workout_sessions")
    .select("template_day_id")
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastIndex = lastSession?.template_day_id
    ? days.findIndex((d) => d.id === lastSession.template_day_id)
    : -1;

  const day = lastIndex === -1 ? days[0] : days[(lastIndex + 1) % days.length];

  let nextTrainingDay = day;
  if (day?.is_rest_day) {
    const startIndex = days.findIndex((d) => d.id === day.id);
    for (let i = 1; i <= days.length; i++) {
      const candidate = days[(startIndex + i) % days.length];
      if (!candidate.is_rest_day) {
        nextTrainingDay = candidate;
        break;
      }
    }
  }

  return { day, nextTrainingDay: nextTrainingDay?.is_rest_day ? null : nextTrainingDay };
}

export async function getSessionWithDetails(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select(
      `*, workout_session_exercises(
        *, exercises(id, name, slug), sets(*)
      )`,
    )
    .eq("id", sessionId)
    .single();
  return data;
}

// Most recent COMPLETED performance of this exercise, for the "última vez"
// reference shown while logging a new set.
export async function getLastPerformance(
  userId: string,
  exerciseId: string,
  excludeSessionId?: string,
) {
  const supabase = await createClient();
  let query = supabase
    .from("workout_sessions")
    .select(
      "id, completed_at, workout_session_exercises!inner(id, exercise_id, sets(*))",
    )
    .eq("user_id", userId)
    .eq("workout_session_exercises.exercise_id", exerciseId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1);

  if (excludeSessionId) query = query.neq("id", excludeSessionId);

  const { data } = await query.maybeSingle();
  if (!data) return null;

  const sessionExercise = data.workout_session_exercises[0];
  return {
    completedAt: data.completed_at as string,
    sets: [...(sessionExercise?.sets ?? [])].sort((a, b) => a.set_number - b.set_number),
  };
}

// Previous completed session for the same routine day, to compare this
// session's totals against once it's finished.
export async function getPreviousSessionForDay(
  userId: string,
  templateDayId: string,
  beforeStartedAt: string,
  excludeSessionId: string,
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("id, total_volume_kg, started_at, workout_session_exercises(sets(reps))")
    .eq("user_id", userId)
    .eq("template_day_id", templateDayId)
    .not("completed_at", "is", null)
    .neq("id", excludeSessionId)
    .lt("started_at", beforeStartedAt)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getPrSetIds(setIds: string[]) {
  if (setIds.length === 0) return new Set<string>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("personal_records")
    .select("session_set_id")
    .in("session_set_id", setIds);
  return new Set((data ?? []).map((r) => r.session_set_id).filter((id): id is string => !!id));
}

export async function listCompletedSessions(userId: string, limit = 30) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select("*, workout_session_exercises(id)")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
