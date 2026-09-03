import { z } from "zod";

export const goalTypeValues = ["weight", "strength", "reps", "frequency", "volume", "custom"] as const;

export const goalTypeLabels: Record<(typeof goalTypeValues)[number], string> = {
  weight: "Peso corporal",
  strength: "Fuerza en un ejercicio",
  reps: "Repeticiones",
  frequency: "Frecuencia de entreno",
  volume: "Volumen",
  custom: "Personalizado",
};

export const createGoalSchema = z.object({
  type: z.enum(goalTypeValues),
  title: z.string().min(2).max(80),
  exerciseId: z.string().uuid().optional().or(z.literal("")),
  initialValue: z.coerce.number().optional().or(z.literal("")),
  targetValue: z.coerce.number(),
  unit: z.string().min(1).max(20),
  targetDate: z.string().optional().or(z.literal("")),
});

export const updateGoalProgressSchema = z.object({
  currentValue: z.coerce.number(),
});
