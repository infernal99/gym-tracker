import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Ponle un nombre al grupo").max(60),
  description: z.string().trim().max(300).optional().or(z.literal("")),
});
