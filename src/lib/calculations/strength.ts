// Epley: 1RM ≈ w × (1 + reps/30). Same formula the training service uses
// for its per-session e1RM, kept here so the UI can recompute it for
// arbitrary weight/rep pairs (the percentage table, "what could I lift").
export function epley1rm(weightKg: number, reps: number): number {
  return weightKg * (1 + reps / 30);
}

// Inverse of Epley: the weight that should be movable for a target rep
// count given a 1RM. Used to turn an estimated 1RM into working weights.
export function weightForReps(oneRepMaxKg: number, reps: number): number {
  return oneRepMaxKg / (1 + reps / 30);
}

// Gym plates bottom out around 1.25 kg a side, and nobody loads 43.7 kg —
// half-kilo steps are the finest increment worth showing.
export function roundToHalf(kg: number): number {
  return Math.round(kg * 2) / 2;
}

export const REP_TARGETS = [1, 2, 3, 5, 8, 10, 12, 15] as const;

export interface RepTarget {
  reps: number;
  weightKg: number;
  percentOfMax: number;
}

export function repTargetsFor1rm(oneRepMaxKg: number): RepTarget[] {
  return REP_TARGETS.map((reps) => {
    const weightKg = weightForReps(oneRepMaxKg, reps);
    return {
      reps,
      weightKg: roundToHalf(weightKg),
      percentOfMax: Math.round((weightKg / oneRepMaxKg) * 100),
    };
  });
}

export type PlateauStatus = "insufficient" | "improving" | "steady" | "plateau" | "regressing";

export interface PlateauAnalysis {
  status: PlateauStatus;
  /** Completed sessions logged since the best estimated 1RM was hit. */
  sessionsSinceBest: number;
  bestE1rm: number | null;
  /** Change between the average of the last 3 sessions and the 3 before them. */
  recentChangePct: number | null;
}

const WINDOW = 3;

// Looks at the best estimated 1RM per session and decides whether the lift
// is still moving. Two signals, because either alone lies: how long since
// the all-time best (a single lucky session shouldn't read as progress
// forever) and the trend of the last few sessions against the ones before
// (which catches a slow slide that never touches the all-time best).
export function analyzePlateau(points: { e1rm: number }[]): PlateauAnalysis {
  if (points.length < WINDOW * 2) {
    return {
      status: "insufficient",
      sessionsSinceBest: 0,
      bestE1rm: points.length > 0 ? Math.max(...points.map((p) => p.e1rm)) : null,
      recentChangePct: null,
    };
  }

  const bestE1rm = Math.max(...points.map((p) => p.e1rm));
  // Within 0.5% of the best counts as matching it: 100.2 kg and 100.0 kg are
  // the same lift, and treating the tiny difference as "not the best" would
  // report a plateau for someone still setting records.
  const lastBestIndex = points.reduce(
    (last, p, i) => (p.e1rm >= bestE1rm * 0.995 ? i : last),
    0,
  );
  const sessionsSinceBest = points.length - 1 - lastBestIndex;

  const avg = (slice: { e1rm: number }[]) => slice.reduce((s, p) => s + p.e1rm, 0) / slice.length;
  const recent = avg(points.slice(-WINDOW));
  const previous = avg(points.slice(-WINDOW * 2, -WINDOW));
  const recentChangePct = previous > 0 ? ((recent - previous) / previous) * 100 : null;

  let status: PlateauStatus;
  if (recentChangePct !== null && recentChangePct <= -3) status = "regressing";
  else if (sessionsSinceBest === 0 || (recentChangePct !== null && recentChangePct >= 2))
    status = "improving";
  else if (sessionsSinceBest >= WINDOW) status = "plateau";
  else status = "steady";

  return { status, sessionsSinceBest, bestE1rm, recentChangePct };
}

export interface GoalEta {
  currentKg: number;
  weeklyRateKg: number;
  weeksRemaining: number | null;
  projectedDate: string | null;
  /** Already there, or moving the wrong way — no meaningful ETA to show. */
  reached: boolean;
}

// Projects when a strength goal will be hit from the plain slope between
// the oldest and newest point in the last ~8 sessions — no smoothing or
// regression, just "how much did this actually move over how many days,"
// extrapolated forward at that same rate.
export function estimateGoalEta(points: { date: string; e1rm: number }[], targetKg: number): GoalEta | null {
  if (points.length < 3) return null;

  const recent = points.slice(-8);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const currentKg = last.e1rm;

  if (currentKg >= targetKg) {
    return { currentKg, weeklyRateKg: 0, weeksRemaining: 0, projectedDate: null, reached: true };
  }

  const daySpan = (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86_400_000;
  if (daySpan <= 0) return null;

  const weeklyRateKg = ((last.e1rm - first.e1rm) / daySpan) * 7;
  if (weeklyRateKg <= 0) {
    return { currentKg, weeklyRateKg, weeksRemaining: null, projectedDate: null, reached: false };
  }

  const weeksRemaining = Math.ceil((targetKg - currentKg) / weeklyRateKg);
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + weeksRemaining * 7);

  return {
    currentKg,
    weeklyRateKg,
    weeksRemaining,
    projectedDate: projectedDate.toISOString(),
    reached: false,
  };
}
