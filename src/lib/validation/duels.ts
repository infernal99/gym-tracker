import { z } from "zod";

// Only metrics where "higher is better" unambiguously — keeps a duel from
// needing a separate direction field (body-weight loss vs gain would be
// ambiguous without one, so it's deliberately not offered here).
export const duelMetricValues = ["exercise", "volume", "workouts", "streak"] as const;
export type DuelMetricOption = (typeof duelMetricValues)[number];

export const duelMetricLabels: Record<DuelMetricOption, string> = {
  exercise: "Fuerza en un ejercicio",
  volume: "Volumen total",
  workouts: "Nº de entrenamientos",
  streak: "Racha más larga",
};

export const createDuelSchema = z.object({
  opponentId: z.string().uuid("Elige a quién retar"),
  metric: z.enum(duelMetricValues),
  name: z.string().min(2).max(80),
  exerciseId: z.string().uuid().optional().or(z.literal("")),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
