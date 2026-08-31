"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { onboardingSchema } from "@/lib/validation/onboarding";
import type { ActionResult } from "@/lib/actions/auth";

export async function onboardingAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse({
    sex: formData.get("sex"),
    primaryGoal: formData.get("primaryGoal"),
    heightCm: formData.get("heightCm") || "",
    initialWeightKg: formData.get("initialWeightKg") || "",
    dateOfBirth: formData.get("dateOfBirth") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = parsed;

  const { error } = await supabase
    .from("profiles")
    .update({
      sex: data.sex,
      primary_goal: data.primaryGoal,
      height_cm: data.heightCm || null,
      initial_weight_kg: data.initialWeightKg || null,
      date_of_birth: data.dateOfBirth || null,
      onboarding_completed: true,
    })
    .eq("id", profile.id);

  if (error) {
    return { error: "No se pudo guardar la información" };
  }

  redirect("/dashboard");
}
