import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PhotoAngle } from "@/lib/photo-angles";

export type { PhotoAngle };
export { PHOTO_ANGLES, PHOTO_ANGLE_LABELS } from "@/lib/photo-angles";

export interface ProgressPhoto {
  id: string;
  angle: PhotoAngle;
  takenAt: string;
  storagePath: string;
  /** Signed, short-lived — the bucket is private, so nothing is ever a stable public URL. */
  url: string;
}

// Signed URLs are the only way to view anything in a private bucket, and
// they expire — generated fresh on every page load rather than stored,
// which is also why none of this can be cached long-term.
const SIGNED_URL_TTL_SECONDS = 60 * 30;

export async function listProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("progress_photos")
    .select("id, angle, storage_path, taken_at")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false });

  const rows = data ?? [];
  if (rows.length === 0) return [];

  const paths = rows.map((r) => r.storage_path);
  const { data: signed } = await supabase.storage
    .from("progress-photos")
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return rows
    .map((r) => ({
      id: r.id,
      angle: r.angle,
      takenAt: r.taken_at,
      storagePath: r.storage_path,
      url: urlByPath.get(r.storage_path) ?? "",
    }))
    .filter((p) => p.url);
}
