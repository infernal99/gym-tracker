import "server-only";
import { createClient } from "@/lib/supabase/server";
import { muscleZone, type MuscleZone } from "@/lib/muscle-colors";

export interface WeeklyMuscleVolume {
  /** ISO date of that week's Monday. */
  weekStart: string;
  label: string;
  totalKg: number;
  byZone: Record<MuscleZone, number>;
}

export interface MuscleZoneChange {
  zone: MuscleZone;
  currentKg: number;
  referenceKg: number;
  /** Label for the reference point (e.g. the first week's date). */
  referenceLabel: string;
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
         exercises(muscle_groups(slug)),
         sets(weight_kg, reps)
       )`,
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", since.toISOString());

  const weeks: WeeklyMuscleVolume[] = [];
  const byWeekStart = new Map<string, WeeklyMuscleVolume>();
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
    byWeekStart.set(start.toLocaleDateString("sv-SE"), week);
  }

  const zoneTotals = new Map<MuscleZone, { volumeKg: number; sets: number }>();

  for (const session of sessions ?? []) {
    const week = byWeekStart.get(
      startOfWeek(new Date(session.completed_at as string)).toLocaleDateString("sv-SE"),
    );
    if (!week) continue;

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
    }
  }

  const zonesWithData = [...zoneTotals.keys()];
  const currentWeek = weeks[weeks.length - 1];
  const previousWeek = weeks[weeks.length - 2];

  const vsLastWeek: MuscleZoneChange[] = zonesWithData
    .map((zone) => ({
      zone,
      currentKg: currentWeek.byZone[zone],
      referenceKg: previousWeek?.byZone[zone] ?? 0,
      referenceLabel: "semana pasada",
    }))
    .filter((c) => c.currentKg > 0 || c.referenceKg > 0);

  // The earliest week (inside this weekCount-week window) that shows any
  // volume for the zone — this is a "since your first record in view" figure
  // rather than a true all-time first, but for how young this app's
  // accounts are the two coincide in practice, and it avoids a second,
  // unbounded query just to find one number.
  const vsFirstRecord: MuscleZoneChange[] = zonesWithData
    .map((zone) => {
      const firstWeek = weeks.find((w) => w.byZone[zone] > 0);
      const isCurrentWeek = firstWeek === currentWeek;
      return {
        zone,
        currentKg: currentWeek.byZone[zone],
        // Treated as "no baseline yet" when the only record is this week's,
        // so the UI reads it as new rather than a nonsensical 0% change.
        referenceKg: isCurrentWeek ? 0 : (firstWeek?.byZone[zone] ?? 0),
        referenceLabel: firstWeek && !isCurrentWeek ? firstWeek.label : "primer registro",
      };
    })
    .filter((c) => c.currentKg > 0 || c.referenceKg > 0);

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
