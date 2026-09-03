import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentStreak, longestStreak, startOfWeek } from "@/lib/date-utils";
import { muscleZone, ZONE_LABELS, type MuscleZone } from "@/lib/muscle-colors";

export type InsightIcon = "flame" | "trending-up" | "calendar" | "sparkles" | "alert";

export interface Insight {
  id: string;
  icon: InsightIcon;
  title: string;
  body: string;
}

const WEEKDAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

type SessionExerciseRow = {
  exercises: { id: string; name: string; slug: string; muscle_groups: { slug: string } | null } | null;
  sets: { weight_kg: number | null; reps: number | null }[];
};
type SessionRow = {
  completed_at: string;
  total_volume_kg: number;
  workout_session_exercises: SessionExerciseRow[];
};

// A handful of auto-generated, situational observations — not every signal
// fires every time, so the dashboard only shows a card when there's
// actually something worth saying, capped so it never overwhelms.
export async function getInsights(userId: string): Promise<Insight[]> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 120);

  const { data } = await supabase
    .from("workout_sessions")
    .select(
      `completed_at, total_volume_kg,
       workout_session_exercises(exercises(id, name, slug, muscle_groups(slug)), sets(weight_kg, reps))`,
    )
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .gte("completed_at", since.toISOString())
    .order("completed_at", { ascending: true });

  const sessions = (data ?? []) as unknown as SessionRow[];
  const insights: Insight[] = [];

  // Fatigue spike: this week's volume far above the trailing 4-week average.
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const weekVolumes = new Map<string, number>();
  for (const s of sessions) {
    const key = startOfWeek(new Date(s.completed_at)).toISOString();
    weekVolumes.set(key, (weekVolumes.get(key) ?? 0) + Number(s.total_volume_kg ?? 0));
  }
  const thisWeekVol = weekVolumes.get(thisWeekStart.toISOString()) ?? 0;
  const priorWeekVols: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - 7 * i);
    const vol = weekVolumes.get(start.toISOString());
    if (vol) priorWeekVols.push(vol);
  }
  const avgPrior =
    priorWeekVols.length > 0 ? priorWeekVols.reduce((a, b) => a + b, 0) / priorWeekVols.length : 0;
  if (avgPrior > 0 && thisWeekVol > avgPrior * 1.5) {
    insights.push({
      id: "fatigue-spike",
      icon: "alert",
      title: "Semana de mucho volumen",
      body: `Llevas ${Math.round(thisWeekVol).toLocaleString("es-ES")} kg esta semana, bastante por encima de tu media reciente (${Math.round(avgPrior).toLocaleString("es-ES")} kg). Vigila el descanso.`,
    });
  }

  // Longest streak ever vs. the current one.
  const allDates = sessions.map((s) => s.completed_at);
  const streak = currentStreak(allDates);
  const bestStreak = longestStreak(allDates);
  if (bestStreak >= 3 && bestStreak === streak) {
    insights.push({
      id: "streak-record",
      icon: "flame",
      title: "¡Racha récord!",
      body: `Estás en tu mejor racha: ${bestStreak} días seguidos entrenando.`,
    });
  } else if (bestStreak >= 3 && bestStreak > streak) {
    insights.push({
      id: "streak-record",
      icon: "flame",
      title: "Tu mejor racha",
      body: `Tu racha más larga hasta ahora ha sido de ${bestStreak} días seguidos.`,
    });
  }

  // Most-improved exercise and most-trained muscle group, over the last 35
  // days split into two halves so "improved" means "recent > earlier",
  // not just "logged again."
  const since35 = new Date();
  since35.setDate(since35.getDate() - 35);
  const midpoint = new Date(since35);
  midpoint.setDate(midpoint.getDate() + 17);
  const recent = sessions.filter((s) => new Date(s.completed_at) >= since35);

  const exerciseHalves = new Map<string, { name: string; early: number; recentBest: number }>();
  const zoneSets = new Map<MuscleZone, number>();
  const weekdayCounts = new Map<number, number>();

  for (const s of recent) {
    const date = new Date(s.completed_at);
    const weekday = (date.getDay() + 6) % 7;
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
    const isEarlyHalf = date < midpoint;

    for (const se of s.workout_session_exercises ?? []) {
      const exercise = se.exercises;
      if (!exercise) continue;
      const validSets = (se.sets ?? []).filter(
        (set): set is { weight_kg: number; reps: number } => set.weight_kg != null && set.reps != null,
      );

      const zone = muscleZone(exercise.muscle_groups?.slug);
      if (zone) zoneSets.set(zone, (zoneSets.get(zone) ?? 0) + validSets.length);

      const bestE1rm = validSets.reduce((best, set) => Math.max(best, set.weight_kg * (1 + set.reps / 30)), 0);
      if (bestE1rm <= 0) continue;
      const entry = exerciseHalves.get(exercise.id) ?? { name: exercise.name, early: 0, recentBest: 0 };
      if (isEarlyHalf) entry.early = Math.max(entry.early, bestE1rm);
      else entry.recentBest = Math.max(entry.recentBest, bestE1rm);
      exerciseHalves.set(exercise.id, entry);
    }
  }

  let mostImproved: { name: string; pct: number } | null = null;
  for (const entry of exerciseHalves.values()) {
    if (entry.early <= 0 || entry.recentBest <= 0) continue;
    const pct = ((entry.recentBest - entry.early) / entry.early) * 100;
    if (pct > 3 && (!mostImproved || pct > mostImproved.pct)) mostImproved = { name: entry.name, pct };
  }
  if (mostImproved) {
    insights.push({
      id: "most-improved",
      icon: "trending-up",
      title: "Ejercicio más mejorado",
      body: `${mostImproved.name} ha subido un ${mostImproved.pct.toFixed(0)}% de 1RM estimado en el último mes.`,
    });
  }

  const topZone = [...zoneSets.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topZone && topZone[1] >= 6) {
    insights.push({
      id: "top-zone",
      icon: "sparkles",
      title: "Grupo más entrenado",
      body: `${ZONE_LABELS[topZone[0]]} ha sido tu grupo muscular más trabajado este mes, con ${topZone[1]} series.`,
    });
  }

  const totalRecentSessions = recent.length;
  const topWeekday = [...weekdayCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topWeekday && totalRecentSessions >= 6 && topWeekday[1] >= totalRecentSessions * 0.4) {
    insights.push({
      id: "favorite-weekday",
      icon: "calendar",
      title: "Tu día favorito",
      body: `Sueles entrenar los ${WEEKDAY_NAMES[topWeekday[0]]}.`,
    });
  }

  const onThisDay = findOnThisDay(sessions);
  if (onThisDay) insights.push(onThisDay);

  return insights.slice(0, 4);
}

// Looks ~1/2/3 months back for a session near that date, then checks
// whether any of its exercises were also trained in the last week — if so,
// reports the concrete then-vs-now comparison as a nostalgia/progress beat.
function findOnThisDay(sessions: SessionRow[]): Insight | null {
  const now = Date.now();
  const recentCutoff = now - 7 * 86_400_000;

  const recentBestByExercise = new Map<string, { name: string; weightKg: number; reps: number }>();
  for (const s of sessions) {
    if (new Date(s.completed_at).getTime() < recentCutoff) continue;
    for (const se of s.workout_session_exercises ?? []) {
      const exercise = se.exercises;
      if (!exercise) continue;
      for (const set of se.sets ?? []) {
        if (set.weight_kg == null || set.reps == null) continue;
        const current = recentBestByExercise.get(exercise.id);
        if (!current || set.weight_kg > current.weightKg) {
          recentBestByExercise.set(exercise.id, { name: exercise.name, weightKg: set.weight_kg, reps: set.reps });
        }
      }
    }
  }
  if (recentBestByExercise.size === 0) return null;

  for (const { daysAgo, label } of [
    { daysAgo: 90, label: "Hace 3 meses" },
    { daysAgo: 60, label: "Hace 2 meses" },
    { daysAgo: 30, label: "Hace un mes" },
  ]) {
    const windowStart = now - (daysAgo + 3) * 86_400_000;
    const windowEnd = now - (daysAgo - 3) * 86_400_000;
    const oldSessions = sessions.filter((s) => {
      const t = new Date(s.completed_at).getTime();
      return t >= windowStart && t <= windowEnd;
    });

    for (const s of oldSessions) {
      for (const se of s.workout_session_exercises ?? []) {
        const exercise = se.exercises;
        if (!exercise) continue;
        const nowBest = recentBestByExercise.get(exercise.id);
        if (!nowBest) continue;

        let oldBest: { weightKg: number; reps: number } | null = null;
        for (const set of se.sets ?? []) {
          if (set.weight_kg == null || set.reps == null) continue;
          if (!oldBest || set.weight_kg > oldBest.weightKg) oldBest = { weightKg: set.weight_kg, reps: set.reps };
        }
        if (!oldBest) continue;
        if (oldBest.weightKg === nowBest.weightKg && oldBest.reps === nowBest.reps) continue;

        return {
          id: "on-this-day",
          icon: "calendar",
          title: `${label}`,
          body: `${label} hacías ${exercise.name} con ${oldBest.weightKg} kg × ${oldBest.reps}. Ahora: ${nowBest.weightKg} kg × ${nowBest.reps}.`,
        };
      }
    }
  }
  return null;
}
