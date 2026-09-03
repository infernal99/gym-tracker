import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MUSCLE_ZONES, muscleZone, type MuscleZone } from "@/lib/muscle-colors";
import { countCompletedSets } from "@/lib/set-utils";

export interface WeeklyMuscleVolume {
  /** ISO date of that week's Monday. */
  weekStart: string;
  label: string;
  totalKg: number;
  byZone: Record<MuscleZone, number>;
}

export interface MuscleZoneChange {
  zone: MuscleZone;
  // Average, across the zone's exercises, of each exercise's own % change in
  // estimated 1RM (Epley) — e.g. 12kg×8 → 12kg×9 is one exercise's +2.6%.
  // Averaging % per exercise (not averaging raw e1RM in kg across exercises)
  // matters because a zone mixes a 100kg bench with a 10kg cable fly: an
  // average in kg would be dominated by whichever lift is heaviest, while
  // each exercise's own percent change counts equally regardless of load.
  // null when no exercise in the zone has both a current and a reference
  // data point to compare.
  changePct: number | null;
  exerciseCount: number;
}

export interface MuscleVolumeStats {
  weeks: WeeklyMuscleVolume[];
  zoneTotals: { zone: MuscleZone; volumeKg: number; sets: number }[];
  vsLastWeek: MuscleZoneChange[];
  vsFirstRecord: MuscleZoneChange[];
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday = 0
  d.setHours(0, 0, 0, 0);
  return d;
}

const emptyZones = (): Record<MuscleZone, number> => ({
  chest: 0,
  back: 0,
  legs: 0,
  shoulders: 0,
  arms: 0,
  core: 0,
});

// Volume split by muscle zone, week by week. The session's stored
// total_volume_kg can't be used here because it isn't broken down by
// exercise, so this recomputes from the sets — every row counts, including
// both sides of a unilateral set, since each side is real work.
export async function getMuscleVolumeStats(
  userId: string,
  weekCount = 12,
): Promise<MuscleVolumeStats> {
  const supabase = await createClient();
  const currentWeekStart = startOfWeek(new Date());
  const since = new Date(currentWeekStart);
  since.setDate(since.getDate() - (weekCount - 1) * 7);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(
      `completed_at,
       workout_session_exercises(
         exercises(id, muscle_groups(slug)),
         sets(weight_kg, reps)
       )`,
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", since.toISOString());

  const weeks: WeeklyMuscleVolume[] = [];
  const byWeekStart = new Map<string, WeeklyMuscleVolume>();
  const weekIndexByKey = new Map<string, number>();
  for (let i = 0; i < weekCount; i++) {
    const start = new Date(since);
    start.setDate(start.getDate() + i * 7);
    const week: WeeklyMuscleVolume = {
      weekStart: start.toISOString(),
      label: start.toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
      totalKg: 0,
      byZone: emptyZones(),
    };
    weeks.push(week);
    const key = start.toLocaleDateString("sv-SE");
    byWeekStart.set(key, week);
    weekIndexByKey.set(key, i);
  }

  const zoneTotals = new Map<MuscleZone, { volumeKg: number; sets: number }>();
  // Each exercise's best estimated 1RM per week it was trained — the basis
  // for the two change cards below, kept separate from the zone's own
  // per-week volume above since the two use different aggregations.
  const exerciseWeeklyBest = new Map<string, { zone: MuscleZone; weekly: Map<number, number> }>();

  for (const session of sessions ?? []) {
    const weekKey = startOfWeek(new Date(session.completed_at as string)).toLocaleDateString("sv-SE");
    const week = byWeekStart.get(weekKey);
    if (!week) continue;
    const weekIndex = weekIndexByKey.get(weekKey)!;

    for (const sessionExercise of session.workout_session_exercises ?? []) {
      const zone = muscleZone(sessionExercise.exercises?.muscle_groups?.slug);
      if (!zone) continue;
      const sets = sessionExercise.sets ?? [];
      const volumeKg = sets.reduce(
        (sum, s) => sum + Number(s.weight_kg ?? 0) * Number(s.reps ?? 0),
        0,
      );

      week.byZone[zone] += volumeKg;
      week.totalKg += volumeKg;

      const total = zoneTotals.get(zone) ?? { volumeKg: 0, sets: 0 };
      total.volumeKg += volumeKg;
      total.sets += sets.length;
      zoneTotals.set(zone, total);

      const exerciseId = sessionExercise.exercises?.id;
      if (exerciseId) {
        let bestE1rm = 0;
        for (const set of sets) {
          if (set.weight_kg == null || set.reps == null) continue;
          const e1rm = Number(set.weight_kg) * (1 + Number(set.reps) / 30);
          if (e1rm > bestE1rm) bestE1rm = e1rm;
        }
        if (bestE1rm > 0) {
          const entry = exerciseWeeklyBest.get(exerciseId) ?? { zone, weekly: new Map<number, number>() };
          const existingBest = entry.weekly.get(weekIndex) ?? 0;
          if (bestE1rm > existingBest) entry.weekly.set(weekIndex, bestE1rm);
          exerciseWeeklyBest.set(exerciseId, entry);
        }
      }
    }
  }

  const exercisesByZone = new Map<MuscleZone, Map<number, number>[]>();
  for (const { zone, weekly } of exerciseWeeklyBest.values()) {
    const list = exercisesByZone.get(zone) ?? [];
    list.push(weekly);
    exercisesByZone.set(zone, list);
  }

  function averageChangePct(
    zone: MuscleZone,
    currentWeekIndex: number,
    baselineFor: (weekly: Map<number, number>) => number | null,
  ): { changePct: number | null; exerciseCount: number } {
    const changes: number[] = [];
    for (const weekly of exercisesByZone.get(zone) ?? []) {
      const current = weekly.get(currentWeekIndex);
      if (current == null) continue;
      const baseline = baselineFor(weekly);
      if (baseline == null || baseline <= 0) continue;
      changes.push(((current - baseline) / baseline) * 100);
    }
    if (changes.length === 0) return { changePct: null, exerciseCount: 0 };
    return {
      changePct: changes.reduce((sum, c) => sum + c, 0) / changes.length,
      exerciseCount: changes.length,
    };
  }

  const zonesWithData = [...zoneTotals.keys()];
  const currentWeekIndex = weeks.length - 1;
  const previousWeekIndex = weeks.length - 2;

  const vsLastWeek: MuscleZoneChange[] = zonesWithData.map((zone) => ({
    zone,
    ...averageChangePct(zone, currentWeekIndex, (weekly) => weekly.get(previousWeekIndex) ?? null),
  }));

  // "First record" means the earliest week (inside this weekCount-week
  // window) each exercise has data — a "since your first record in view"
  // figure rather than a true all-time first, but for how young this app's
  // accounts are the two coincide in practice, and it avoids a second,
  // unbounded query just to find one number.
  const vsFirstRecord: MuscleZoneChange[] = zonesWithData.map((zone) => ({
    zone,
    ...averageChangePct(zone, currentWeekIndex, (weekly) => {
      let firstIndex: number | null = null;
      for (const idx of weekly.keys()) {
        if (idx === currentWeekIndex) continue;
        if (firstIndex === null || idx < firstIndex) firstIndex = idx;
      }
      return firstIndex === null ? null : weekly.get(firstIndex)!;
    }),
  }));

  return {
    weeks,
    zoneTotals: [...zoneTotals.entries()]
      .map(([zone, t]) => ({ zone, ...t }))
      .sort((a, b) => b.volumeKg - a.volumeKg),
    vsLastWeek,
    vsFirstRecord,
  };
}

export interface ExportRow {
  date: string;
  session: string;
  exercise: string;
  setNumber: number;
  side: string;
  weightKg: number | null;
  reps: number | null;
  rir: number | null;
  rpe: number | null;
  volumeKg: number;
}

// One row per logged set — the shape someone would actually want in a
// spreadsheet, rather than a session-level summary they can't drill into.
export async function listExportRows(userId: string): Promise<ExportRow[]> {
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(
      `name, completed_at,
       workout_session_exercises(
         order_index,
         exercises(name),
         sets(set_number, side, weight_kg, reps, rir, rpe)
       )`,
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: true });

  const rows: ExportRow[] = [];
  for (const session of sessions ?? []) {
    const exercises = [...(session.workout_session_exercises ?? [])].sort(
      (a, b) => a.order_index - b.order_index,
    );
    for (const sessionExercise of exercises) {
      const sets = [...(sessionExercise.sets ?? [])].sort((a, b) => a.set_number - b.set_number);
      for (const set of sets) {
        const weightKg = set.weight_kg === null ? null : Number(set.weight_kg);
        rows.push({
          date: session.completed_at as string,
          session: session.name,
          exercise: sessionExercise.exercises?.name ?? "",
          setNumber: set.set_number,
          side: set.side,
          weightKg,
          reps: set.reps,
          rir: set.rir,
          rpe: set.rpe === null ? null : Number(set.rpe),
          volumeKg: (weightKg ?? 0) * (set.reps ?? 0),
        });
      }
    }
  }
  return rows;
}

export type VolumeStatus = "low" | "optimal" | "high";

export interface ZoneWeeklyVolume {
  zone: MuscleZone;
  sets: number;
  status: VolumeStatus;
}

// Rough hypertrophy-training set-count landmarks (roughly the "MEV/MAV/MRV"
// ranges popularized by Renaissance Periodization) — a single general range
// rather than one per muscle group, since this is meant as an orientation
// nudge, not a prescription. Below it usually means real progress will
// stall; well above it usually means diminishing returns and slower
// recovery, not extra growth.
export const LOW_SETS_THRESHOLD = 10;
export const HIGH_SETS_THRESHOLD = 20;

// This week's completed sets per muscle zone with a traffic-light read —
// every zone is included even at 0 sets, since a muscle group that's gone
// quiet is exactly what this is meant to surface.
export async function getWeeklyVolumeStatus(userId: string): Promise<ZoneWeeklyVolume[]> {
  const supabase = await createClient();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select(
      `completed_at, workout_session_exercises(exercises(muscle_groups(slug)), sets(set_number))`,
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", weekStart.toISOString());

  const zoneSets = new Map<MuscleZone, number>();
  for (const session of sessions ?? []) {
    for (const sessionExercise of session.workout_session_exercises ?? []) {
      const zone = muscleZone(sessionExercise.exercises?.muscle_groups?.slug);
      if (!zone) continue;
      const sets = countCompletedSets(sessionExercise.sets ?? []);
      zoneSets.set(zone, (zoneSets.get(zone) ?? 0) + sets);
    }
  }

  return MUSCLE_ZONES.map((zone) => {
    const sets = zoneSets.get(zone) ?? 0;
    const status: VolumeStatus =
      sets < LOW_SETS_THRESHOLD ? "low" : sets <= HIGH_SETS_THRESHOLD ? "optimal" : "high";
    return { zone, sets, status };
  });
}
