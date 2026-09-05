"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

export type ActionResult = { error: string } | { error: null };

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function registerAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const { data } = parsed;
  const supabase = await createClient();

  // profiles.username is unique in the DB regardless, but that failure
  // surfaces through signUp as an opaque "Database error saving new user"
  // (the trigger that creates the profile row runs after the auth user is
  // already inserted) — checking first gives a message that actually says
  // what's wrong.
  const { data: taken } = await supabase.rpc("is_username_taken", {
    p_username: data.username,
  });
  if (taken) {
    return { error: "Ese nombre de usuario ya está en uso" };
  }

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback`,
      data: {
        display_name: data.displayName,
        username: data.username,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ese email ya está registrado" };
    }
    // The username-taken case above covers the normal path; this is only
    // the rare race where two people submit the same brand-new username at
    // the same instant, which still surfaces as this opaque message.
    if (error.message.toLowerCase().includes("database error saving new user")) {
      return { error: "Ese nombre de usuario ya está en uso" };
    }
    return { error: error.message };
  }

  redirect("/verify-email");
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email o contraseña incorrectos" };
  }

  revalidatePath("/", "layout");
  const redirectTo = formData.get("redirectTo");
  // Only ever follow an internal path — never let a redirect target chosen
  // via a form field send someone off-site.
  redirect(typeof redirectTo === "string" && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function deleteAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    return { error: "No se pudo eliminar la cuenta. Inténtalo de nuevo." };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login?deleted=1");
}

export type ForgotPasswordResult = { status: "idle" } | { status: "error"; message: string } | { status: "sent" };

export async function forgotPasswordAction(
  _prev: ForgotPasswordResult,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl()}/auth/callback?next=/reset-password`,
  });

  // Always report success so we don't leak which emails are registered.
  return { status: "sent" };
}

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
