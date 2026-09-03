import { z } from "zod";

export const usernameSearchSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,20}$/, "Username no válido"),
});
