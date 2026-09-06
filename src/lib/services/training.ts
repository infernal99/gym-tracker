import "server-only";
import { createClient } from "@/lib/supabase/server";
import { dayKey, startOfWeek } from "@/lib/date-utils";

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
  const { data: slots } = await supabase
    .from("workout_template_weekday_slots")
    .select("weekday, day_id")
    .eq("template_id", templateId);

  const slotByWeekday = new Map((slots ?? []).map((s) => [s.weekday, s.day_id]));
  const dayById = new Map(days.map((d) => [d.id, d]));
  const pinnedToday = dayById.get(slotByWeekday.get(todayWeekday) ?? "");

  if (pinnedToday) {
    if (!pinnedToday.is_rest_day) return { day: pinnedToday, nextTrainingDay: pinnedToday };

    // Today's a pinned rest day — the next training day is whatever the
    // calendar has pinned to the NEXT weekday that isn't also rest, not the
    // template's own day_order (that list has no notion of "which weekday
    // comes after Sunday"; walking it instead picked whatever happened to
    // sit next in the day-creation order, e.g. jumping to a day meant for
    // Wednesday). Only weekdays actually pinned are considered here; an
    // unpinned gap is skipped rather than treated as a dead end.
    for (let offset = 1; offset <= 6; offset++) {
      const candidate = dayById.get(slotByWeekday.get((todayWeekday + offset) % 7) ?? "");
      if (candidate && !candidate.is_rest_day) {
        return { day: pinnedToday, nextTrainingDay: candidate };
      }
    }
    // No non-rest day anywhere in the weekly calendar — fall through to the
    // day_order sequence below as a last resort rather than showing nothing.
  }

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
          muscle_groups(name, slug), equipment(name, slug)
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

export type RestComparison = {
  targetSeconds: number;
  actualSeconds: number;
  diffSeconds: number;
};

type ExerciseSetRow = {
  set_number: number;
  side: "both" | "left" | "right";
  weight_kg: number | null;
  reps: number | null;
  completed_at: string | null;
};

type ExerciseSessionRow = {
  completed_at: string;
  workout_session_exercises: { rest_seconds: number | null; sets: ExerciseSetRow[] }[];
};

type ValidSet = ExerciseSetRow & { weight_kg: number; reps: number };

const e1rmOf = (weightKg: number, reps: number) => weightKg * (1 + reps / 30);
const round1 = (value: number) => Math.round(value * 10) / 10;

const setsOf = (session: ExerciseSessionRow): ExerciseSetRow[] =>
  session.workout_session_exercises[0]?.sets ?? [];

const validSetsOf = (session: ExerciseSessionRow): ValidSet[] =>
  setsOf(session).filter((s): s is ValidSet => s.weight_kg != null && s.reps != null);

// A unilateral set logs a left and a right row under the same set_number.
// Anything that treats a set as one data point wants a single row per
// number: the combined 'both' row when there is one, else whichever side
// came first.
function oneRowPerSetNumber<T extends { set_number: number; side: string }>(sets: T[]): T[] {
  const bySetNumber = new Map<number, T>();
  for (const set of sets) {
    const existing = bySetNumber.get(set.set_number);
    if (!existing || set.side === "both") bySetNumber.set(set.set_number, set);
  }
  return [...bySetNumber.values()].sort((a, b) => a.set_number - b.set_number);
}

// One point per session: its best set by estimated 1RM, plus that session's
// volume for the exercise. sessionPoints keeps every set number separately,
// which the chart needs to show e.g. set 3 on its own — the top set alone
// doesn't say whether the later ones are moving too.
function buildProgressPoints(sessions: ExerciseSessionRow[]) {
  const points: ExerciseProgressPoint[] = [];
  const sessionPoints: ExerciseSessionSets[] = [];

  for (const session of sessions) {
    const validSets = validSetsOf(session);
    if (validSets.length === 0) continue;

    const volumeKg = validSets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0);
    const best = validSets.reduce((a, b) =>
      e1rmOf(b.weight_kg, b.reps) > e1rmOf(a.weight_kg, a.reps) ? b : a,
    );

    points.push({
      date: session.completed_at,
      weightKg: best.weight_kg,
      reps: best.reps,
      e1rm: round1(e1rmOf(best.weight_kg, best.reps)),
      volumeKg,
    });

    sessionPoints.push({
      date: session.completed_at,
      volumeKg,
      sets: oneRowPerSetNumber(validSets).map((s) => ({
        setNumber: s.set_number,
        weightKg: s.weight_kg,
        reps: s.reps,
        e1rm: round1(e1rmOf(s.weight_kg, s.reps)),
      })),
    });
  }

  return { points, sessionPoints };
}

// Left/right balance, from the last 5 sessions that actually logged separate
// sides. Recent-only on purpose: an imbalance the user already corrected
// months ago shouldn't keep dragging the average.
function computeSideBalance(sessions: ExerciseSessionRow[]): SideBalance | null {
  const unilateral = sessions
    .filter((session) => setsOf(session).some((s) => s.side === "left" || s.side === "right"))
    .slice(-5);
  if (unilateral.length === 0) return null;

  const totals = { left: { sum: 0, count: 0 }, right: { sum: 0, count: 0 } };
  for (const session of unilateral) {
    for (const set of validSetsOf(session)) {
      if (set.side === "both") continue;
      const side = totals[set.side];
      side.sum += e1rmOf(set.weight_kg, set.reps);
      side.count += 1;
    }
  }
  if (totals.left.count === 0 || totals.right.count === 0) return null;

  const leftAvg = totals.left.sum / totals.left.count;
  const rightAvg = totals.right.sum / totals.right.count;
  const weaker = Math.min(leftAvg, rightAvg);

  return {
    leftE1rm: round1(leftAvg),
    rightE1rm: round1(rightAvg),
    diffPct: weaker > 0 ? (Math.abs(leftAvg - rightAvg) / weaker) * 100 : 0,
    strongerSide: leftAvg === rightAvg ? null : leftAvg > rightAvg ? "left" : "right",
  };
}

// Actual rest vs. target, over the last 5 sessions. There's no rest-timer
// log, so the gap between consecutive sets' completed_at stands in for it —
// that also includes however long the next set took, so it reads slightly
// high, but it's the only signal in the data.
function computeRestComparison(sessions: ExerciseSessionRow[]): RestComparison | null {
  const gaps: number[] = [];
  let targetSeconds: number | null = null;

  for (const session of sessions.slice(-5)) {
    const sessionExercise = session.workout_session_exercises[0];
    if (!sessionExercise) continue;
    if (sessionExercise.rest_seconds != null) targetSeconds = sessionExercise.rest_seconds;

    const times = oneRowPerSetNumber(sessionExercise.sets.filter((s) => s.completed_at)).map((s) =>
      new Date(s.completed_at as string).getTime(),
    );
    for (let i = 1; i < times.length; i++) {
      const gapSeconds = (times[i] - times[i - 1]) / 1000;
      // Over 15 minutes is an interruption (a call, another exercise in
      // between), not rest.
      if (gapSeconds > 0 && gapSeconds < 900) gaps.push(gapSeconds);
    }
  }

  if (gaps.length < 3 || !targetSeconds) return null;
  const avgGap = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  return {
    targetSeconds,
    actualSeconds: Math.round(avgGap),
    diffSeconds: Math.round(avgGap - targetSeconds),
  };
}

// Week-over-week reads on the same data at two levels: the session's single
// best set (weekOverWeek) and every set number's own % change averaged
// together (the "combined" figures). The two differ because set 1 and set 3
// sit at different absolute weights — averaging their raw e1RM would just
// track whichever set is heaviest, so each set's own percentage is computed
// first and only the percentages get averaged.
function computeWeeklyChanges(points: ExerciseProgressPoint[], sessionPoints: ExerciseSessionSets[]) {
  const thisWeekStart = startOfWeek(new Date());
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

  const setNumberWeekly = new Map<number, Map<string, number>>();
  for (const sp of sessionPoints) {
    const weekKey = dayKey(startOfWeek(new Date(sp.date)));
    for (const s of sp.sets) {
      const weekly = setNumberWeekly.get(s.setNumber) ?? new Map<string, number>();
      if (s.e1rm > (weekly.get(weekKey) ?? 0)) weekly.set(weekKey, s.e1rm);
      setNumberWeekly.set(s.setNumber, weekly);
    }
  }

  const thisWeekKey = dayKey(thisWeekStart);
  const lastWeekKey = dayKey(lastWeekStart);

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
    return {
      changePct: changes.length > 0 ? changes.reduce((sum, c) => sum + c, 0) / changes.length : null,
      setCount: changes.length,
      perSet,
    };
  }

  return {
    weekOverWeek: {
      bestThisWeek,
      bestLastWeek,
      changePct:
        bestThisWeek !== null && bestLastWeek
          ? ((bestThisWeek - bestLastWeek) / bestLastWeek) * 100
          : null,
    },
    combinedWeekOverWeek: averageChangeAcrossSets((weekly) => weekly.get(lastWeekKey) ?? null),
    // A true all-time first here (unlike the muscle stats page, this query
    // isn't windowed): the earliest week that set number appears, skipping
    // this week so a set done for the first time ever today reads as having
    // no baseline rather than a 0% change.
    combinedSinceFirst: averageChangeAcrossSets((weekly) => {
      let firstKey: string | null = null;
      for (const key of weekly.keys()) {
        if (key === thisWeekKey) continue;
        if (firstKey === null || key < firstKey) firstKey = key;
      }
      return firstKey === null ? null : weekly.get(firstKey)!;
    }),
  };
}

export async function getExerciseProgress(userId: string, exerciseId: string) {
  const supabase = await createClient();
  const [{ data: sessions }, { data: personalRecords }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id, completed_at, workout_session_exercises!inner(id, exercise_id, rest_seconds, sets(*))")
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

  const rows = (sessions ?? []) as unknown as ExerciseSessionRow[];
  const { points, sessionPoints } = buildProgressPoints(rows);

  return {
    points,
    sessionPoints,
    personalRecords: personalRecords ?? [],
    ...computeWeeklyChanges(points, sessionPoints),
    sideBalance: computeSideBalance(rows),
    restComparison: computeRestComparison(rows),
  };
}

// Just the e1RM trend, for several exercises at once. The goals page needs
// this for every strength goal it shows: calling getExerciseProgress per
// goal meant one query each, plus computing five other things per call only
// to throw them away.
export async function getExerciseTrends(
  userId: string,
  exerciseIds: string[],
): Promise<Map<string, ExerciseProgressPoint[]>> {
  const byExercise = new Map<string, ExerciseProgressPoint[]>();
  if (exerciseIds.length === 0) return byExercise;

  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("completed_at, workout_session_exercises!inner(exercise_id, sets(weight_kg, reps))")
    .eq("user_id", userId)
    .in("workout_session_exercises.exercise_id", exerciseIds)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: true });

  for (const session of sessions ?? []) {
    // A session can contain several of the requested exercises, so unlike
    // the single-exercise query above this can't just take [0].
    for (const sessionExercise of session.workout_session_exercises ?? []) {
      const validSets = (sessionExercise.sets ?? []).filter(
        (s): s is { weight_kg: number; reps: number } => s.weight_kg != null && s.reps != null,
      );
      if (validSets.length === 0) continue;

      const best = validSets.reduce((a, b) =>
        e1rmOf(b.weight_kg, b.reps) > e1rmOf(a.weight_kg, a.reps) ? b : a,
      );
      const list = byExercise.get(sessionExercise.exercise_id) ?? [];
      list.push({
        date: session.completed_at as string,
        weightKg: best.weight_kg,
        reps: best.reps,
        e1rm: round1(e1rmOf(best.weight_kg, best.reps)),
        volumeKg: validSets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0),
      });
      byExercise.set(sessionExercise.exercise_id, list);
    }
  }

  return byExercise;
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
