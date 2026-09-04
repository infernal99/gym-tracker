"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { logWeightSchema, logMeasurementSchema } from "@/lib/validation/body";
import { MEASUREMENT_COLUMNS, type MeasurementKey } from "@/lib/body-measurements";
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
  const keys = Object.keys(MEASUREMENT_COLUMNS) as MeasurementKey[];
  const parsed = logMeasurementSchema.safeParse(
    Object.fromEntries(keys.map((key) => [key, formData.get(key) || ""])),
  );

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const values = parsed.data as Record<MeasurementKey, number | "" | undefined>;
  const row = Object.fromEntries(
    keys.map((key) => [MEASUREMENT_COLUMNS[key], values[key] || null]),
  );

  // An entry with nothing filled in is just noise in the history.
  if (Object.values(row).every((value) => value === null)) {
    return { error: "Introduce al menos una medida" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("body_measurements")
    .insert({ user_id: profile.id, ...row });

  if (error) {
    return { error: "No se pudieron guardar las medidas" };
  }

  revalidatePath("/body");
  return { error: null };
}
