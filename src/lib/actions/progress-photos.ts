"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { PHOTO_ANGLES } from "@/lib/photo-angles";
import type { ActionResult } from "@/lib/actions/auth";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function uploadProgressPhotoAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const file = formData.get("file");
  const angle = formData.get("angle");
  const takenAt = formData.get("takenAt");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una foto" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { error: "La foto pesa demasiado (máximo 8 MB)" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen" };
  }
  if (typeof angle !== "string" || !PHOTO_ANGLES.includes(angle as (typeof PHOTO_ANGLES)[number])) {
    return { error: "Ángulo no válido" };
  }
  const takenAtStr = typeof takenAt === "string" && takenAt ? takenAt : new Date().toISOString().slice(0, 10);

  const profile = await requireProfile();
  const supabase = await createClient();

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${profile.id}/${angle}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("progress-photos")
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: "No se pudo subir la foto" };
  }

  const { error: insertError } = await supabase.from("progress_photos").insert({
    user_id: profile.id,
    angle: angle as (typeof PHOTO_ANGLES)[number],
    storage_path: path,
    taken_at: takenAtStr,
  });

  if (insertError) {
    // Don't leave an orphaned file in storage if the row never landed.
    await supabase.storage.from("progress-photos").remove([path]);
    return { error: "No se pudo guardar la foto" };
  }

  revalidatePath("/body/photos");
  revalidatePath("/body");
  return { error: null };
}

export async function deleteProgressPhotoAction(photoId: string, storagePath: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("progress_photos")
    .delete()
    .eq("id", photoId)
    .eq("user_id", profile.id);

  await supabase.storage.from("progress-photos").remove([storagePath]);

  revalidatePath("/body/photos");
  revalidatePath("/body");
}
