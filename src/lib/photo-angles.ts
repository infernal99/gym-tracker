// Split out from services/progress-photos.ts (which is server-only) so
// client components — the upload dialog's angle picker — can import these
// constants without pulling in a server-only module.
import type { Database } from "@/types/database.types";

export type PhotoAngle = Database["public"]["Enums"]["photo_angle"];

export const PHOTO_ANGLES: PhotoAngle[] = ["front", "side", "back"];

export const PHOTO_ANGLE_LABELS: Record<PhotoAngle, string> = {
  front: "Frontal",
  side: "Lateral",
  back: "Trasera",
};
