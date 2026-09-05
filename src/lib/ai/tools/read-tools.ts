import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, getProfileStats } from "@/lib/services/profile";
import { getTemplate } from "@/lib/services/routines";
import {
  getExerciseProgress,
  listCompletedSessions,
  getSessionWithDetails,
} from "@/lib/services/training";
import { listGoals } from "@/lib/services/goals";
import { listWeightEntries } from "@/lib/services/body";
import { listExercises, listMuscleGroups } from "@/lib/services/exercises";
import { getWeeklySummary } from "@/lib/services/weekly-summary";
import { getWeeklyVolumeStatus } from "@/lib/services/stats";
import type { AITool } from "@/lib/ai/tools/types";

type ReadTool = AITool;

// Fuzzy-matches a name the model typed (e.g. "press banca") against the
// real exercise library — the model must never invent an exercise id.
export async function resolveExercise(name: string) {
  const matches = await listExercises({ search: name });
  return matches[0] ?? null;
}

const getUserProfile: ReadTool = {
  definition: {
    name: "get_user_profile",
    description:
      "Devuelve el perfil del usuario: objetivo principal, altura, peso inicial, nivel y XP. Úsalo para personalizar respuestas o rutinas.",
    parameters: { type: "object", properties: {} },
  },
  execute: async ({ userId }) => {
    const profile = await getCurrentProfile();
    if (!profile || profile.id !== userId) return { found: false };
    return {
      found: true,
      displayName: profile.display_name,
      primaryGoal: profile.primary_goal,
      heightCm: profile.height_cm,
      initialWeightKg: profile.initial_weight_kg,
      level: profile.level,
      xp: profile.xp,
      hasActiveRoutine: Boolean(profile.active_template_id),
    };
  },
};

const getActiveRoutine: ReadTool = {
  definition: {
    name: "get_active_routine",
    description:
      "Devuelve la rutina activa del usuario: sus días, ejercicios, series y repeticiones objetivo. Devuelve found:false si no tiene ninguna activa.",
    parameters: { type: "object", properties: {} },
  },
  execute: async () => {
    const profile = await getCurrentProfile();
    if (!profile?.active_template_id) return { found: false };
    const template = await getTemplate(profile.active_template_id);
    if (!template) return { found: false };
    return {
      found: true,
      name: template.name,
      days: (template.workout_template_days ?? []).map((day) => ({
        name: day.name,
        order: day.day_order,
        exercises: (day.workout_template_exercises ?? [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((te) => ({
            name: te.exercises?.name,
            targetSets: te.target_sets,
            targetRepsMin: te.target_reps_min,
            targetRepsMax: te.target_reps_max,
          })),
      })),
    };
  },
};

const getWorkoutHistory: ReadTool = {
  definition: {
    name: "get_workout_history",
    description: "Devuelve las últimas sesiones de entrenamiento completadas del usuario.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Cuántas sesiones devolver (por defecto 10, máximo 30)" },
      },
    },
  },
  execute: async ({ userId }, args) => {
    const limit = Math.min(Number(args.limit) || 10, 30);
    const sessions = await listCompletedSessions(userId, limit);
    return {
      count: sessions.length,
      sessions: sessions.map((s) => ({
        id: s.id,
        name: s.name,
        completedAt: s.completed_at,
        durationSeconds: s.duration_seconds,
        totalVolumeKg: s.total_volume_kg,
        exerciseCount: s.workout_session_exercises?.length ?? 0,
      })),
    };
  },
};

const getLastWorkoutDetail: ReadTool = {
  definition: {
    name: "get_last_workout_detail",
    description:
      "Devuelve el detalle completo (ejercicios, series, peso, reps) de una sesión de entrenamiento concreta por su id. Usa primero get_workout_history para obtener el id.",
    parameters: {
      type: "object",
      properties: { sessionId: { type: "string", description: "id de la sesión" } },
      required: ["sessionId"],
    },
  },
  execute: async (_ctx, args) => {
    const session = await getSessionWithDetails(String(args.sessionId));
    if (!session) return { found: false };
    return {
      found: true,
      name: session.name,
      completedAt: session.completed_at,
      exercises: (session.workout_session_exercises ?? []).map((se) => ({
        name: se.exercises?.name,
        sets: (se.sets ?? []).map((s: { weight_kg: number | null; reps: number | null }) => ({
          weightKg: s.weight_kg,
          reps: s.reps,
        })),
      })),
    };
  },
};

const getExerciseProgressTool: ReadTool = {
  definition: {
    name: "get_exercise_progress",
    description:
      "Analiza la progresión de un ejercicio concreto a lo largo del tiempo: peso, repeticiones, 1RM estimado y PRs. Usa el nombre tal como lo escribió el usuario (se busca por coincidencia).",
    parameters: {
      type: "object",
      properties: {
        exerciseName: { type: "string", description: "Nombre del ejercicio, ej. 'press banca'" },
      },
      required: ["exerciseName"],
    },
  },
  execute: async ({ userId }, args) => {
    const exercise = await resolveExercise(String(args.exerciseName));
    if (!exercise) return { found: false, reason: "exercise_not_found" };

    const progress = await getExerciseProgress(userId, exercise.id);
    if (progress.points.length === 0) {
      return { found: true, exerciseName: exercise.name, hasData: false };
    }
    const first = progress.points[0];
    const last = progress.points[progress.points.length - 1];
    return {
      found: true,
      hasData: true,
      exerciseName: exercise.name,
      sessionsLogged: progress.points.length,
      firstLogged: { date: first.date, weightKg: first.weightKg, reps: first.reps, e1rm: first.e1rm },
      lastLogged: { date: last.date, weightKg: last.weightKg, reps: last.reps, e1rm: last.e1rm },
      e1rmChangePct:
        first.e1rm > 0 ? Math.round(((last.e1rm - first.e1rm) / first.e1rm) * 1000) / 10 : null,
      personalRecords: progress.personalRecords.map((pr) => ({
        type: pr.record_type,
        value: pr.value,
        weightKg: pr.weight_kg,
        reps: pr.reps,
        achievedAt: pr.achieved_at,
      })),
      recentSets: progress.points.slice(-6).map((p) => ({
        date: p.date,
        weightKg: p.weightKg,
        reps: p.reps,
        e1rm: p.e1rm,
      })),
    };
  },
};

const getPersonalRecords: ReadTool = {
  definition: {
    name: "get_personal_records",
    description: "Lista los récords personales (PRs) del usuario, opcionalmente filtrados por ejercicio.",
    parameters: {
      type: "object",
      properties: {
        exerciseName: { type: "string", description: "Filtra por un ejercicio concreto (opcional)" },
      },
    },
  },
  execute: async ({ userId }, args) => {
    const supabase = await createClient();
    let exerciseId: string | null = null;
    if (args.exerciseName) {
      const exercise = await resolveExercise(String(args.exerciseName));
      if (!exercise) return { found: false, reason: "exercise_not_found" };
      exerciseId = exercise.id;
    }

    let query = supabase
      .from("personal_records")
      .select("record_type, value, weight_kg, reps, achieved_at, exercises(name)")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false })
      .limit(20);
    if (exerciseId) query = query.eq("exercise_id", exerciseId);

    const { data } = await query;
    return {
      found: true,
      records: (data ?? []).map((r) => ({
        exerciseName: r.exercises?.name,
        type: r.record_type,
        value: r.value,
        weightKg: r.weight_kg,
        reps: r.reps,
        achievedAt: r.achieved_at,
      })),
    };
  },
};

const getBodyWeightHistory: ReadTool = {
  definition: {
    name: "get_body_weight_history",
    description: "Devuelve el historial de peso corporal registrado por el usuario.",
    parameters: { type: "object", properties: {} },
  },
  execute: async ({ userId }) => {
    const entries = await listWeightEntries(userId);
    if (entries.length === 0) return { found: true, hasData: false };
    return {
      found: true,
      hasData: true,
      current: entries[entries.length - 1],
      first: entries[0],
      totalEntries: entries.length,
      recent: entries.slice(-8),
    };
  },
};

const getGoals: ReadTool = {
  definition: {
    name: "get_goals",
    description: "Lista los objetivos activos y completados del usuario, con su progreso.",
    parameters: { type: "object", properties: {} },
  },
  execute: async ({ userId }) => {
    const goals = await listGoals(userId);
    return {
      found: true,
      goals: goals.map((g) => ({
        title: g.title,
        type: g.type,
        exerciseName: g.exerciseName,
        currentValue: g.currentValue,
        targetValue: g.targetValue,
        unit: g.unit,
        status: g.status,
        targetDate: g.targetDate,
      })),
    };
  },
};

const getTrainingStatistics: ReadTool = {
  definition: {
    name: "get_training_statistics",
    description:
      "Resumen de estadísticas de entrenamiento: total de entrenamientos, volumen, racha, PRs, comparación con la semana anterior y volumen semanal por grupo muscular.",
    parameters: { type: "object", properties: {} },
  },
  execute: async ({ userId }) => {
    const [stats, weekly, muscleVolume] = await Promise.all([
      getProfileStats(userId),
      getWeeklySummary(userId),
      getWeeklyVolumeStatus(userId),
    ]);
    return {
      totalWorkouts: stats.totalWorkouts,
      totalVolumeKg: Math.round(stats.totalVolumeKg),
      totalPrs: stats.totalPrs,
      currentStreak: stats.currentStreak,
      thisWeek: weekly.thisWeek,
      lastWeek: weekly.lastWeek,
      muscleVolumeThisWeek: muscleVolume.map((z) => ({
        zone: z.zone,
        setsThisWeek: z.sets,
        status: z.status,
      })),
    };
  },
};

const findExercises: ReadTool = {
  definition: {
    name: "find_exercises",
    description:
      "Busca ejercicios REALES en la biblioteca de Gym Tracker. Úsalo antes de proponer una rutina, para usar solo ejercicios que existen. Busca por nombre de ejercicio ('press', 'sentadilla') o grupo muscular concreto ('pecho', 'espalda', 'piernas', 'hombros', 'bíceps', 'tríceps', 'glúteos', 'core'). NUNCA busques un concepto de entrenamiento como 'hipertrofia' o 'fuerza' — eso no es un ejercicio ni un grupo muscular y no devolverá nada.",
    parameters: {
      type: "object",
      properties: {
        search: { type: "string", description: "Nombre de ejercicio o grupo muscular, ej. 'press' o 'pecho'" },
      },
    },
  },
  execute: async (_ctx, args) => {
    const raw = args.search ? String(args.search) : "";
    // The model sometimes sends several terms in one call ("pecho,espalda,
    // piernas") — the underlying search does an AND across whitespace
    // tokens, so a comma-joined string alone would never match anything.
    // Splitting on common separators and searching each term separately
    // (then merging) makes that case work instead of just failing.
    const terms = raw
      .split(/[,;/]+| y | and /i)
      .map((t) => t.trim())
      .filter(Boolean);

    const searches = terms.length > 1 ? terms : [raw];
    const byId = new Map<string, Awaited<ReturnType<typeof listExercises>>[number]>();
    for (const term of searches) {
      const found = await listExercises({ search: term || undefined });
      for (const exercise of found) byId.set(exercise.id, exercise);
    }
    const results = [...byId.values()];

    if (results.length === 0 && raw) {
      const groups = await listMuscleGroups();
      return {
        count: 0,
        exercises: [],
        hint: `'${raw}' no es un ejercicio ni un grupo muscular real. Vuelve a llamar a find_exercises, una vez por cada uno de estos grupos musculares: ${groups.map((g) => g.name).join(", ")}.`,
      };
    }

    return {
      count: results.length,
      exercises: results.slice(0, 30).map((e) => ({
        name: e.name,
        muscleGroup: e.muscle_groups?.name,
        equipment: e.equipment?.name,
      })),
    };
  },
};

export const READ_TOOLS: ReadTool[] = [
  getUserProfile,
  getActiveRoutine,
  getWorkoutHistory,
  getLastWorkoutDetail,
  getExerciseProgressTool,
  getPersonalRecords,
  getBodyWeightHistory,
  getGoals,
  getTrainingStatistics,
  findExercises,
];
