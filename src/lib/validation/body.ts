import { z } from "zod";

export const logWeightSchema = z.object({
  weightKg: z.coerce.number().positive().max(500),
  note: z.string().max(200).optional().or(z.literal("")),
});

// Every measurement is optional — people rarely record all of them in one
// sitting, and a half-filled entry is still worth keeping.
const optionalCm = z.coerce.number().positive().max(300).optional().or(z.literal(""));

export const logMeasurementSchema = z.object({
  neckCm: optionalCm,
  chestCm: optionalCm,
  waistCm: optionalCm,
  hipCm: optionalCm,
  armLeftCm: optionalCm,
  armRightCm: optionalCm,
  forearmLeftCm: optionalCm,
  forearmRightCm: optionalCm,
  thighLeftCm: optionalCm,
  thighRightCm: optionalCm,
  calfLeftCm: optionalCm,
  calfRightCm: optionalCm,
});
