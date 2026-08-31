import { z } from "zod";

export const templateSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(60),
  description: z.string().trim().max(280).optional().or(z.literal("")),
});

export type TemplateInput = z.infer<typeof templateSchema>;

export const daySchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre al día").max(40),
  isRestDay: z.coerce.boolean().default(false),
  muscleGroupIds: z.array(z.string().uuid()).default([]),
});

export type DayInput = z.infer<typeof daySchema>;

export const templateExerciseSchema = z.object({
  exerciseId: z.string().uuid("Selecciona un ejercicio"),
  targetSets: z.coerce.number().int().min(1).max(20),
  targetRepsMin: z.coerce.number().int().min(1).max(100).optional().or(z.literal("")),
  targetRepsMax: z.coerce.number().int().min(1).max(100).optional().or(z.literal("")),
  targetWeightKg: z.coerce.number().min(0).optional().or(z.literal("")),
  targetRir: z.coerce.number().int().min(0).max(10).optional().or(z.literal("")),
  restSeconds: z.coerce.number().int().min(0).max(900).default(90),
  notes: z.string().trim().max(280).optional().or(z.literal("")),
});

export type TemplateExerciseInput = z.infer<typeof templateExerciseSchema>;
