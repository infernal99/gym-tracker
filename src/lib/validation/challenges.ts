import { z } from "zod";

export const challengeTypeValues = ["body_weight", "exercise", "consistency"] as const;
export type ChallengeTypeOption = (typeof challengeTypeValues)[number];

export const challengeTypeLabels: Record<ChallengeTypeOption, string> = {
  body_weight: "Peso corporal",
  exercise: "Fuerza en un ejercicio",
  consistency: "Constancia (no fallar entrenos)",
};

export const createChallengeSchema = z.object({
  type: z.enum(challengeTypeValues),
  name: z.string().min(2).max(80),
  exerciseId: z.string().uuid().optional().or(z.literal("")),
  targetValue: z.coerce.number(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});
