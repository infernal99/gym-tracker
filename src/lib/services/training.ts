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

function resolveRestDay<T extends { id: string; is_rest_day: boolean }>(
  days: T[],
  day: T | null,
) {
  if (!day) return { day: null, nextTrainingDay: null };
  let nextTrainingDay = day;
  if (day.is_rest_day) {
    const startIndex = days.findIndex((d) => d.id === day.id);
    for (let i = 1; i <= days.length; i++) {
      const candidate = days[(startIndex + i) % days.length];
      if (!candidate.is_rest_day) {
        nextTrainingDay = candidate;
        break;
      }
    }
  }
  return { day, nextTrainingDay: nextTrainingDay.is_rest_day ? null : nextTrainingDay };
}

// The routine is a sequence by default, but weekdays can optionally be
// pinned to a day via workout_template_weekday_slots (the drag-and-drop
// calendar on Mi rutina; the same day can occupy several weekdays) — when
// today has a pinned day, that's authoritative: the calendar is a
// deliberate, always-visible choice, so it wins over everything else. The
// legacy manual anchor (profiles.sequence_anchor_day_id) — from a UI
// control that no longer exists — only applies as a fallback when today
// has no calendar pin, so it can't get a user permanently stuck on a day
// they have no way to change anymore; it's cleared the next time a
// counting session is completed.
export async function getNextDayInSequence(userId: string, templateId: string) {
  const supabase = await createClient();
  const { data: days } = await supabase
    .from("workout_template_days")
    .select("*")
    .eq("template_id", templateId)
    .order("day_order");

  if (!days || days.length === 0) return { day: null, nextTrainingDay: null };

  const todayWeekday = (new Date().getDay() + 6) % 7; // Monday = 0
  const { data: slot } = await supabase
    .from("workout_template_weekday_slots")
    .select("day_id")
    .eq("template_id", templateId)
    .eq("weekday", todayWeekday)
    .maybeSingle();

  const pinnedToday = slot ? days.find((d) => d.id === slot.day_id) : undefined;
  if (pinnedToday) return resolveRestDay(days, pinnedToday);

  const { data: profile } = await supabase
    .from("profiles")
    .select("sequence_anchor_day_id")
    .eq("id", userId)
    .single();

  if (profile?.sequence_anchor_day_id) {
    const anchored = days.find((d) => d.id === profile.sequence_anchor_day_id);
    if (anchored) return resolveRestDay(days, anchored);
  }

  const { data: lastSession } = await supabase
    .from("workout_sessions")
    .select("template_day_id")
    .eq("user_id", userId)
    .eq("template_id", templateId)
    .eq("counts_toward_sequence", true)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastIndex = lastSession?.template_day_id
    ? days.findIndex((d) => d.id === lastSession.template_day_id)
    : -1;

  const day = lastIndex === -1 ? days[0] : days[(lastIndex + 1) % days.length];
  return resolveRestDay(days, day);
}

export async function listTrainingDays(templateId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_template_days")
    .select("id, name, day_order, is_rest_day")
    .eq("template_id", templateId)
    .eq("is_rest_day", false)
    .order("day_order");
  return data ?? [];
}

export async function getSessionWithDetails(sessionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_sessions")
    .select(
      `*, workout_session_exercises(
        *, exercises(
          id, name, slug, description, difficulty, movement_type,
          instructions, tips, common_mistakes, image_url, alternate_names,
          muscle_groups(name, slug), equipment(name)
        ), sets(*)
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
  const sideOrder = { left: 0, right: 1, both: 0 } as const;
  return {
    completedAt: data.completed_at as string,
    sets: [...(sessionExercise?.sets ?? [])].sort(
      (a, b) => a.set_number - b.set_number || sideOrder[a.side] - sideOrder[b.side],
    ),
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

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export type ExerciseProgressPoint = {
  date: string;
  weightKg: number;
  reps: number;
  e1rm: number;
  volumeKg: number;
};

export type ExerciseSetPoint = {
  setNumber: number;
  weightKg: number;
  reps: number;
  e1rm: number;
};

export type ExerciseSessionSets = {
  date: string;
  volumeKg: number;
  sets: ExerciseSetPoint[];
};

export type SideBalance = {
  leftE1rm: number;
  rightE1rm: number;
  diffPct: number;
  strongerSide: "left" | "right" | null;
};

// One point per completed session that includes this exercise: the set with
// the best estimated 1RM (Epley) that session represents that day's top
// performance, plus that session's total volume for the exercise.
// sessionPoints carries every individual set (not just the best one) so the
// chart can also show a single set number's progression across sessions —
// the first set alone doesn't show whether e.g. set 3 is improving too.
export async function getExerciseProgress(userId: string, exerciseId: string) {
  const supabase = await createClient();
  const [{ data: sessions }, { data: personalRecords }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, completed_at, workout_session_exercises!inner(id, exercise_id, sets(*))")
      .eq("user_id", userId)
      .eq("workout_session_exercises.exercise_id", exerciseId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true }),
    supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .order("achieved_at", { ascending: false }),
  ]);

  const points: ExerciseProgressPoint[] = [];
  const sessionPoints: ExerciseSessionSets[] = [];
  for (const session of sessions ?? []) {
    const sessionExercise = session.workout_session_exercises[0];
    const validSets = (sessionExercise?.sets ?? []).filter(
      (s): s is typeof s & { weight_kg: number; reps: number } =>
        s.weight_kg != null && s.reps != null,
    );
    if (validSets.length === 0) continue;

    const volumeKg = validSets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
    const best = validSets.reduce((a, b) =>
      b.weight_kg * (1 + b.reps / 30) > a.weight_kg * (1 + a.reps / 30) ? b : a,
    );

    points.push({
      date: session.completed_at as string,
      weightKg: best.weight_kg,
      reps: best.reps,
      e1rm: Math.round(best.weight_kg * (1 + best.reps / 30) * 10) / 10,
      volumeKg,
    });

    // A unilateral set has a left+right row for the same set_number — prefer
    // the combined 'both' row when present, otherwise keep the first side
    // seen, so each set_number appears once per session.
    const bySetNumber = new Map<number, (typeof validSets)[number]>();
    for (const s of validSets) {
      const existing = bySetNumber.get(s.set_number);
      if (!existing || s.side === "both") bySetNumber.set(s.set_number, s);
    }
    sessionPoints.push({
      date: session.completed_at as string,
      volumeKg,
      sets: [...bySetNumber.values()]
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
          setNumber: s.set_number,
          weightKg: s.weight_kg,
          reps: s.reps,
          e1rm: Math.round(s.weight_kg * (1 + s.reps / 30) * 10) / 10,
        })),
    });
  }

  // Left/right balance for unilateral exercises, from the last 5 sessions
  // that actually logged separate sides (a session logged as 'both' — or
  // an exercise that was never done unilaterally — contributes nothing
  // here). Recent-only on purpose: this should reflect current form, not
  // get diluted by an imbalance the user already corrected months ago.
  const unilateralSessions = (sessions ?? [])
    .filter((session) =>
      (session.workout_session_exercises[0]?.sets ?? []).some((s) => s.side === "left" || s.side === "right"),
    )
    .slice(-5);

  let sideBalance: SideBalance | null = null;
  if (unilateralSessions.length > 0) {
    let leftSum = 0;
    let leftCount = 0;
    let rightSum = 0;
    let rightCount = 0;
    for (const session of unilateralSessions) {
      for (const s of session.workout_session_exercises[0]?.sets ?? []) {
        if (s.weight_kg == null || s.reps == null) continue;
        const e1rm = s.weight_kg * (1 + s.reps / 30);
        if (s.side === "left") {
          leftSum += e1rm;
          leftCount += 1;
        } else if (s.side === "right") {
          rightSum += e1rm;
          rightCount += 1;
        }
      }
    }
    if (leftCount > 0 && rightCount > 0) {
      const leftAvg = leftSum / leftCount;
      const rightAvg = rightSum / rightCount;
      const weaker = Math.min(leftAvg, rightAvg);
      sideBalance = {
        leftE1rm: Math.round(leftAvg * 10) / 10,
        rightE1rm: Math.round(rightAvg * 10) / 10,
        diffPct: weaker > 0 ? (Math.abs(leftAvg - rightAvg) / weaker) * 100 : 0,
        strongerSide: leftAvg === rightAvg ? null : leftAvg > rightAvg ? "left" : "right",
      };
    }
  }

  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const bestE1rmIn = (from: Date, to?: Date) => {
    const inRange = points.filter((p) => {
      const d = new Date(p.date);
      return d >= from && (!to || d < to);
    });
    return inRange.length > 0 ? Math.max(...inRange.map((p) => p.e1rm)) : null;
  };

  const bestThisWeek = bestE1rmIn(thisWeekStart);
  const bestLastWeek = bestE1rmIn(lastWeekStart, thisWeekStart);

  // Best estimated 1RM per set number per week — the basis for the two
  // "combined" figures below. Kept separate from `points` (that session's
  // single best set, whichever number it was) because set 1 and set 3
  // usually sit at different absolute weights; averaging their raw e1RM
  // together would just track whichever set happens to be heaviest, so
  // instead each set number's own % change is computed first and only
  // those percentages are averaged.
  const setNumberWeekly = new Map<number, Map<string, number>>();
  for (const sp of sessionPoints) {
    const weekKey = startOfWeek(new Date(sp.date)).toISOString();
    for (const s of sp.sets) {
      const weekly = setNumberWeekly.get(s.setNumber) ?? new Map<string, number>();
      const existing = weekly.get(weekKey) ?? 0;
      if (s.e1rm > existing) weekly.set(weekKey, s.e1rm);
      setNumberWeekly.set(s.setNumber, weekly);
    }
  }

  const thisWeekKey = thisWeekStart.toISOString();
  const lastWeekKey = lastWeekStart.toISOString();

  function averageChangeAcrossSets(baselineFor: (weekly: Map<string, number>) => number | null) {
    const changes: number[] = [];
    const perSet: { setNumber: number; changePct: number | null }[] = [];
    for (const [setNumber, weekly] of setNumberWeekly.entries()) {
      const current = weekly.get(thisWeekKey);
      const baseline = current == null ? null : baselineFor(weekly);
      if (current == null || baseline == null || baseline <= 0) {
        perSet.push({ setNumber, changePct: null });
        continue;
      }
      const changePct = ((current - baseline) / baseline) * 100;
      changes.push(changePct);
      perSet.push({ setNumber, changePct });
    }
    perSet.sort((a, b) => a.setNumber - b.setNumber);
    if (changes.length === 0) return { changePct: null, setCount: 0, perSet };
    return {
      changePct: changes.reduce((sum, c) => sum + c, 0) / changes.length,
      setCount: changes.length,
      perSet,
    };
  }

  const combinedWeekOverWeek = averageChangeAcrossSets((weekly) => weekly.get(lastWeekKey) ?? null);

  // "Since first record" here is a true all-time first (unlike the muscle
  // stats page, this query already fetches full history, not a 12-week
  // window) — the earliest week that set number appears, excluding this
  // week itself so a set trained for the first time ever this week reads
  // as having no baseline yet rather than a 0% change.
  const combinedSinceFirst = averageChangeAcrossSets((weekly) => {
    let firstKey: string | null = null;
    for (const key of weekly.keys()) {
      if (key === thisWeekKey) continue;
      if (firstKey === null || key < firstKey) firstKey = key;
    }
    return firstKey === null ? null : weekly.get(firstKey)!;
  });

  return {
    points,
    sessionPoints,
    personalRecords: personalRecords ?? [],
    weekOverWeek: {
      bestThisWeek,
      bestLastWeek,
      changePct:
        bestThisWeek !== null && bestLastWeek ? ((bestThisWeek - bestLastWeek) / bestLastWeek) * 100 : null,
    },
    combinedWeekOverWeek,
    combinedSinceFirst,
    sideBalance,
  };
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

// Every completed session in the last ~year, for the profile's GitHub-style
// contribution heatmap. One row per session (a day can have more than one).
export async function listWorkoutActivity(userId: string, days = 371) {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data } = await supabase
    .from("workout_sessions")
    .select("id, name, completed_at, duration_seconds, total_volume_kg")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", since.toISOString())
    .order("completed_at", { ascending: true });
  return data ?? [];
}
