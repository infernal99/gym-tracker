import { z } from "zod";

export const logWeightSchema = z.object({
  weightKg: z.coerce.number().positive().max(500),
  note: z.string().max(200).optional().or(z.literal("")),
});

export const logMeasurementSchema = z.object({
  waistCm: z.coerce.number().positive().optional().or(z.literal("")),
  chestCm: z.coerce.number().positive().optional().or(z.literal("")),
  armCm: z.coerce.number().positive().optional().or(z.literal("")),
  forearmCm: z.coerce.number().positive().optional().or(z.literal("")),
  thighCm: z.coerce.number().positive().optional().or(z.literal("")),
  calfCm: z.coerce.number().positive().optional().or(z.literal("")),
  hipCm: z.coerce.number().positive().optional().or(z.literal("")),
});
