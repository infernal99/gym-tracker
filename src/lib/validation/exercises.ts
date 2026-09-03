import { z } from "zod";

export const difficultyValues = ["beginner", "intermediate", "advanced"] as const;
export const movementTypeValues = ["compound", "isolation", "cardio", "mobility"] as const;

export const createExerciseSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  muscleGroupId: z.string().uuid("Selecciona un grupo muscular"),
  equipmentId: z.string().uuid().optional().or(z.literal("")),
  difficulty: z.enum(difficultyValues),
  movementType: z.enum(movementTypeValues),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
