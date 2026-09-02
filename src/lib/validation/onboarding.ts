import { z } from "zod";
import { primaryGoalValues } from "@/lib/validation/auth";
import { activityLevelValues } from "@/lib/calculations/harris-benedict";

export const sexValues = ["male", "female", "other"] as const;

export const sexLabels: Record<(typeof sexValues)[number], string> = {
  male: "Hombre",
  female: "Mujer",
  other: "Otro",
};

export const onboardingSchema = z.object({
  sex: z.enum(sexValues),
  primaryGoal: z.enum(primaryGoalValues),
  activityLevel: z.enum(activityLevelValues as [string, ...string[]]),
  heightCm: z.coerce.number().positive().optional().or(z.literal("")),
  initialWeightKg: z.coerce.number().positive().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
