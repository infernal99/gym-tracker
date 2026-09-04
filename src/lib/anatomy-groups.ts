import type { MuscleZone } from "@/lib/muscle-colors";

// The 3D model has 12 individually clickable anatomical groups (matching
// real muscle names), but the app's own stats are only ever aggregated at
// the coarser 6-zone level (see muscle-colors.ts) — getMuscleVolumeStats
// doesn't track biceps separately from triceps, for instance. Each group
// here points at the zone whose color/stats it borrows, so the model can be
// anatomically precise while the info panel still reads from data that
// already exists rather than a parallel 12-way aggregation.
export type AnatomyGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves";

export const ANATOMY_GROUPS: AnatomyGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "abs",
  "obliques",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
];

export const ANATOMY_GROUP_LABELS: Record<AnatomyGroup, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  forearms: "Antebrazos",
  abs: "Abdominales",
  obliques: "Oblicuos",
  quads: "Cuádriceps",
  hamstrings: "Isquiotibiales",
  glutes: "Glúteos",
  calves: "Gemelos",
};

export const ANATOMY_GROUP_ZONE: Record<AnatomyGroup, MuscleZone> = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abs: "core",
  obliques: "core",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
};
