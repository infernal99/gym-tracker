"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { createExerciseSchema } from "@/lib/validation/exercises";
import type { ActionResult } from "@/lib/actions/auth";

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "ejercicio"}-${suffix}`;
}

export async function createExerciseAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createExerciseSchema.safeParse({
    name: formData.get("name"),
    muscleGroupId: formData.get("muscleGroupId"),
    equipmentId: formData.get("equipmentId") || "",
    difficulty: formData.get("difficulty"),
    movementType: formData.get("movementType"),
    description: formData.get("description") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const profile = await requireProfile();
  const supabase = await createClient();
  const d = parsed.data;

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: d.name,
      slug: slugify(d.name),
      primary_muscle_group_id: d.muscleGroupId,
      equipment_id: d.equipmentId || null,
      difficulty: d.difficulty,
      movement_type: d.movementType,
      description: d.description || null,
      is_custom: true,
      created_by: profile.id,
    })
    .select("slug")
    .single();

  if (error || !data) {
    return { error: "No se pudo crear el ejercicio" };
  }

  revalidatePath("/exercises");
  redirect(`/exercises/${data.slug}`);
}

export async function toggleFavoriteAction(exerciseId: string, isFavorite: boolean) {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (isFavorite) {
    await supabase
      .from("exercise_favorites")
      .delete()
      .eq("user_id", profile.id)
      .eq("exercise_id", exerciseId);
  } else {
    await supabase
      .from("exercise_favorites")
      .insert({ user_id: profile.id, exercise_id: exerciseId });
  }

  revalidatePath("/exercises");
}

const noteSchema = z.object({
  note: z.string().trim().max(500),
});

export async function saveExerciseNoteAction(exerciseId: string, formData: FormData) {
  const parsed = noteSchema.safeParse({ note: formData.get("note") ?? "" });
  if (!parsed.success) return;

  const profile = await requireProfile();
  const supabase = await createClient();

  if (parsed.data.note === "") {
    await supabase
      .from("exercise_notes")
      .delete()
      .eq("user_id", profile.id)
      .eq("exercise_id", exerciseId);
  } else {
    await supabase
      .from("exercise_notes")
      .upsert(
        { user_id: profile.id, exercise_id: exerciseId, note: parsed.data.note },
        { onConflict: "user_id,exercise_id" },
      );
  }

  revalidatePath(`/exercises`);
}
