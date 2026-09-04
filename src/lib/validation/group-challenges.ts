import { z } from "zod";

// Only the metrics that make sense as a shared/competitive group challenge
// with no personal baseline to snapshot — each starts every participant at
// 0 and measures what they do *during* the challenge window. "Reps at a
// fixed weight" and "first to a personal goal" from the original spec are
// deliberately left out: the former needs a second weight parameter this
// schema doesn't have yet, and the latter is just any of these four with a
// target, not a distinct metric.
export const groupChallengeMetricValues = ["exercise", "volume", "workouts", "streak"] as const;
export type GroupChallengeMetric = (typeof groupChallengeMetricValues)[number];

export const groupChallengeMetricLabels: Record<GroupChallengeMetric, string> = {
  exercise: "Mayor peso en un ejercicio",
  volume: "Mayor volumen total",
  workouts: "Más entrenamientos",
  streak: "Racha más larga",
};

export const groupChallengeUnit: Record<GroupChallengeMetric, string> = {
  exercise: "kg",
  volume: "kg",
  workouts: "entrenos",
  streak: "días",
};

export const createGroupChallengeSchema = z.object({
  metric: z.enum(groupChallengeMetricValues),
  name: z.string().trim().min(2, "Ponle un nombre al reto").max(80),
  exerciseId: z.string().uuid().optional().or(z.literal("")),
  targetValue: z.coerce.number().positive("La meta debe ser mayor que 0"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isCollective: z.coerce.boolean(),
});
