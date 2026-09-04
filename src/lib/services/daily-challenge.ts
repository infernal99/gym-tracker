import "server-only";
import { createClient } from "@/lib/supabase/server";
import { dayKey } from "@/lib/date-utils";

export type ChallengeTone = "near_pr" | "just_set_pr" | "stalled" | "improving" | "bounce_back";

export interface DailyChallenge {
  exercise: { id: string; name: string; slug: string };
  /** Best set of the most recent session with this exercise. */
  lastBest: { weightKg: number; reps: number; date: string };
  /** All-time best set by estimated 1RM, when it isn't the one above. */
  personalBest: { weightKg: number; reps: number } | null;
  /** A concrete, deliberately modest reference — never a load increase. */
  suggestion: { weightKg: number; reps: number };
  tone: ChallengeTone;
  headline: string;
  body: string;
}

type SetRow = { set_number: number; side: string; weight_kg: number | null; reps: number | null };
type SessionRow = {
  completed_at: string;
  workout_session_exercises: {
    exercise_id: string;
    exercises: { id: string; name: string; slug: string } | null;
    sets: SetRow[];
  }[];
};

const e1rm = (weightKg: number, reps: number) => weightKg * (1 + reps / 30);

type ExerciseHistory = {
  exercise: { id: string; name: string; slug: string };
  /** Best set per session, most recent first. */
  sessions: { date: string; weightKg: number; reps: number; e1rm: number }[];
};

// Picks one exercise worth talking about today and writes the line about it.
//
// Two rules shape this. It only ever looks at what the user actually did —
// no invented numbers, and nothing at all when there isn't enough history.
// And the suggestion is always "one more rep at the same weight", never a
// heavier bar: the point is to give the session a reference, not to push
// somebody into a load they haven't earned.
export async function getDailyChallenge(
  userId: string,
  templateDayId: string | null,
): Promise<DailyChallenge | null> {
  const supabase = await createClient();

  // Prefer what's actually on the plan for today — a challenge about an
  // exercise you aren't going to touch is noise.
  let plannedExerciseIds: string[] = [];
  if (templateDayId) {
    const { data: dayExercises } = await supabase
      .from("workout_template_exercises")
      .select("exercise_id")
      .eq("template_day_id", templateDayId);
    plannedExerciseIds = (dayExercises ?? []).map((e) => e.exercise_id);
  }

  const since = new Date();
  since.setDate(since.getDate() - 120);

  let query = supabase
    .from("workout_sessions")
    .select(
      `completed_at,
       workout_session_exercises(exercise_id, exercises(id, name, slug), sets(set_number, side, weight_kg, reps))`,
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", since.toISOString())
    .order("completed_at", { ascending: false });

  const [{ data }, { data: activeGoals }] = await Promise.all([
    query,
    supabase.from("goals").select("exercise_id").eq("user_id", userId).eq("status", "active"),
  ]);

  const sessions = (data ?? []) as unknown as SessionRow[];
  const goalExerciseIds = new Set(
    (activeGoals ?? []).map((g) => g.exercise_id).filter((id): id is string => !!id),
  );

  // Best set per exercise per session, newest first.
  const histories = new Map<string, ExerciseHistory>();
  for (const session of sessions) {
    for (const se of session.workout_session_exercises ?? []) {
      const exercise = se.exercises;
      if (!exercise) continue;
      let best: { weightKg: number; reps: number; e1rm: number } | null = null;
      for (const set of se.sets ?? []) {
        if (set.weight_kg == null || set.reps == null || set.weight_kg <= 0) continue;
        const value = e1rm(set.weight_kg, set.reps);
        if (!best || value > best.e1rm) best = { weightKg: set.weight_kg, reps: set.reps, e1rm: value };
      }
      if (!best) continue;
      const entry = histories.get(exercise.id) ?? { exercise, sessions: [] };
      entry.sessions.push({ date: session.completed_at, ...best });
      histories.set(exercise.id, entry);
    }
  }

  const candidates = [...histories.values()].filter((h) => {
    if (h.sessions.length < 2) return false; // needs something to compare against
    return plannedExerciseIds.length === 0 || plannedExerciseIds.includes(h.exercise.id);
  });
  if (candidates.length === 0) return null;

  const today = dayKey(new Date());
  const scored = candidates.map((history) => {
    const [latest, previous] = history.sessions;
    const allTimeBest = history.sessions.reduce((a, b) => (b.e1rm > a.e1rm ? b : a));
    const analysis = analyse(latest, previous, allTimeBest);

    let score = 0;
    if (goalExerciseIds.has(history.exercise.id)) score += 3;
    if (analysis.tone === "near_pr") score += 3;
    if (analysis.tone === "stalled") score += 2;
    if (analysis.tone === "just_set_pr") score += 2;
    if (analysis.tone === "improving") score += 1;
    score += Math.min(history.sessions.length, 4) * 0.5;

    return { history, latest, allTimeBest, analysis, score, tiebreak: hash(today + history.exercise.id) };
  });

  scored.sort((a, b) => b.score - a.score || a.tiebreak - b.tiebreak);
  const winner = scored[0];
  const { history, latest, allTimeBest, analysis } = winner;

  return {
    exercise: history.exercise,
    lastBest: { weightKg: latest.weightKg, reps: latest.reps, date: latest.date },
    personalBest:
      allTimeBest.e1rm > latest.e1rm
        ? { weightKg: allTimeBest.weightKg, reps: allTimeBest.reps }
        : null,
    // Always the same load, one extra rep. Modest by design.
    suggestion: { weightKg: latest.weightKg, reps: latest.reps + 1 },
    tone: analysis.tone,
    headline: analysis.headline,
    body: analysis.body,
  };
}

type Snapshot = { weightKg: number; reps: number; e1rm: number };

function analyse(latest: Snapshot, previous: Snapshot, allTimeBest: Snapshot) {
  const fmt = (s: Snapshot) => `${s.weightKg} kg × ${s.reps}`;

  // Checked before the personal-best case on purpose: repeating the exact
  // same set twice is usually *also* "matching your best", but "you've done
  // this twice now, can you get one more rep?" is the more useful read of
  // it than "you're at your record".
  if (latest.weightKg === previous.weightKg && latest.reps === previous.reps) {
    return {
      tone: "stalled" as const,
      headline: "Llevas dos sesiones iguales",
      body: `Las dos últimas veces hiciste ${fmt(latest)}. ¿Te sale una repetición más?`,
    };
  }

  if (latest.e1rm >= allTimeBest.e1rm * 0.995) {
    return {
      tone: "just_set_pr" as const,
      headline: "Vienes de tu mejor marca",
      body: `Tu última sesión (${fmt(latest)}) igualó o superó tu mejor registro. ¿Hasta dónde llegas hoy?`,
    };
  }

  const gapKg = allTimeBest.weightKg - latest.weightKg;
  if (allTimeBest.e1rm > 0 && latest.e1rm >= allTimeBest.e1rm * 0.95 && gapKg > 0) {
    return {
      tone: "near_pr" as const,
      headline: `A ${Math.round(gapKg * 10) / 10} kg de tu récord`,
      body: `Tu mejor marca es ${fmt(allTimeBest)} y la última vez hiciste ${fmt(latest)}.`,
    };
  }

  if (latest.e1rm < previous.e1rm * 0.97) {
    return {
      tone: "bounce_back" as const,
      headline: "Volvemos a por ello",
      body: `La última sesión (${fmt(latest)}) fue algo por debajo de la anterior. Una sesión no define tu progreso.`,
    };
  }

  if (latest.e1rm > previous.e1rm) {
    return {
      tone: "improving" as const,
      headline: "Vas progresando",
      body: `La última vez hiciste ${fmt(latest)}, mejor que la sesión anterior (${fmt(previous)}).`,
    };
  }

  // Within a few percent either way. Saying "mejor que la anterior" here
  // would be plainly false — 80×8 is not an improvement on 77.5×10 — so
  // this reports both numbers and claims nothing about them.
  return {
    tone: "improving" as const,
    headline: "Ahí sigues",
    body: `Tus dos últimas sesiones fueron ${fmt(latest)} y ${fmt(previous)}. Muy parejas.`,
  };
}

// Small stable hash so the pick is steady through the day but can differ
// tomorrow, instead of flipping between equally-scored exercises on every
// dashboard render.
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}
