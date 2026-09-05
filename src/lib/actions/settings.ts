"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { updateBottomNavSchema } from "@/lib/validation/settings";
import type { ActionResult } from "@/lib/actions/auth";

export async function updateBottomNavAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = updateBottomNavSchema.safeParse({
    hrefs: formData.getAll("hrefs"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Elige exactamente 5 pestañas" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ bottom_nav_links: parsed.data.hrefs })
    .eq("id", profile.id);

  if (error) {
    return { error: "No se pudo guardar la barra de navegación" };
  }

  revalidatePath("/", "layout");
  return { error: null };
}
