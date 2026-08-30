import { z } from "zod";
import { primaryGoalValues } from "@/lib/validation/auth";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(50),
  bio: z.string().trim().max(280).optional().or(z.literal("")),
  heightCm: z.coerce.number().positive().max(300).optional().or(z.literal("")),
  primaryGoal: z.enum(primaryGoalValues),
  profileVisibility: z.enum(["public", "friends", "private"]),
  workoutsVisibility: z.enum(["friends", "private"]),
  weightVisibility: z.enum(["friends", "private"]),
  prsVisibility: z.enum(["friends", "private"]),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
