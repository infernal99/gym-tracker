"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { updateProfileSchema } from "@/lib/validation/profile";
import type { ActionResult } from "@/lib/actions/auth";

export async function updateProfileAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio") ?? "",
    heightCm: formData.get("heightCm") || "",
    primaryGoal: formData.get("primaryGoal"),
    profileVisibility: formData.get("profileVisibility"),
    workoutsVisibility: formData.get("workoutsVisibility"),
    weightVisibility: formData.get("weightVisibility"),
    prsVisibility: formData.get("prsVisibility"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio || null,
      height_cm: parsed.data.heightCm || null,
      primary_goal: parsed.data.primaryGoal,
      profile_visibility: parsed.data.profileVisibility,
      workouts_visibility: parsed.data.workoutsVisibility,
      weight_visibility: parsed.data.weightVisibility,
      prs_visibility: parsed.data.prsVisibility,
    })
    .eq("id", profile.id);

  if (error) {
    return { error: "No se pudo guardar el perfil" };
  }

  revalidatePath("/profile");
  return { error: null };
}
