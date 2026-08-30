import { z } from "zod";

export const primaryGoalValues = [
  "gain_muscle",
  "lose_fat",
  "gain_strength",
  "maintain",
  "improve_performance",
  "body_recomposition",
] as const;

export const primaryGoalLabels: Record<(typeof primaryGoalValues)[number], string> = {
  gain_muscle: "Ganar músculo",
  lose_fat: "Perder grasa",
  gain_strength: "Ganar fuerza",
  maintain: "Mantener peso",
  improve_performance: "Mejorar rendimiento",
  body_recomposition: "Recomposición corporal",
};

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, "Mínimo 2 caracteres").max(50),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Mínimo 3 caracteres")
      .max(20, "Máximo 20 caracteres")
      .regex(/^[a-z0-9_.]+$/, "Solo letras minúsculas, números, punto y guion bajo"),
    email: z.string().trim().email("Email no válido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
    dateOfBirth: z.string().optional().or(z.literal("")),
    heightCm: z.coerce.number().positive().optional().or(z.literal("")),
    initialWeightKg: z.coerce.number().positive().optional().or(z.literal("")),
    primaryGoal: z.enum(primaryGoalValues),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Email no válido"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email no válido"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
