"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";

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
