"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { logWeightSchema, logMeasurementSchema } from "@/lib/validation/body";
import type { ActionResult } from "@/lib/actions/auth";

export async function logWeightAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = logWeightSchema.safeParse({
    weightKg: formData.get("weightKg"),
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.from("body_weight_entries").insert({
    user_id: profile.id,
    weight_kg: parsed.data.weightKg,
    note: parsed.data.note || null,
  });

  if (error) {
    return { error: "No se pudo guardar el peso" };
  }

  revalidatePath("/body");
  return { error: null };
}

export async function deleteWeightEntryAction(entryId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("body_weight_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", profile.id);

  revalidatePath("/body");
}

export async function logMeasurementAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = logMeasurementSchema.safeParse({
    waistCm: formData.get("waistCm") || "",
    chestCm: formData.get("chestCm") || "",
    armCm: formData.get("armCm") || "",
    forearmCm: formData.get("forearmCm") || "",
    thighCm: formData.get("thighCm") || "",
    calfCm: formData.get("calfCm") || "",
    hipCm: formData.get("hipCm") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  const d = parsed.data;

  const { error } = await supabase.from("body_measurements").insert({
    user_id: profile.id,
    waist_cm: d.waistCm || null,
    chest_cm: d.chestCm || null,
    arm_cm: d.armCm || null,
    forearm_cm: d.forearmCm || null,
    thigh_cm: d.thighCm || null,
    calf_cm: d.calfCm || null,
    hip_cm: d.hipCm || null,
  });

  if (error) {
    return { error: "No se pudieron guardar las medidas" };
  }

  revalidatePath("/body");
  return { error: null };
}
