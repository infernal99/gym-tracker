// Maps our muscle_groups taxonomy onto the app's 6-zone color system
// (pecho/espalda/piernas/hombros/brazos/core), used as an identifier, not
// decoration, per the design reference.
const ZONE_BY_SLUG: Record<string, "chest" | "back" | "legs" | "shoulders" | "arms" | "core"> = {
  chest: "chest",
  back: "back",
  traps: "back",
  lower_back: "back",
  legs: "legs",
  quads: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  adductors: "legs",
  abductors: "legs",
  shoulders: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  core: "core",
};

const CLASSES_BY_ZONE: Record<string, string> = {
  chest: "bg-muscle-chest/15 text-muscle-chest",
  back: "bg-muscle-back/15 text-muscle-back",
  legs: "bg-muscle-legs/15 text-muscle-legs",
  shoulders: "bg-muscle-shoulders/15 text-muscle-shoulders",
  arms: "bg-muscle-arms/15 text-muscle-arms",
  core: "bg-muscle-core/15 text-muscle-core",
};

export function muscleBadgeClass(slug: string | null | undefined) {
  if (!slug) return "bg-secondary text-secondary-foreground";
  const zone = ZONE_BY_SLUG[slug];
  return zone ? CLASSES_BY_ZONE[zone] : "bg-secondary text-secondary-foreground";
}

const DOT_BY_ZONE: Record<string, string> = {
  chest: "bg-muscle-chest",
  back: "bg-muscle-back",
  legs: "bg-muscle-legs",
  shoulders: "bg-muscle-shoulders",
  arms: "bg-muscle-arms",
  core: "bg-muscle-core",
};

export function muscleDotClass(slug: string | null | undefined) {
  if (!slug) return "bg-muted-foreground";
  const zone = ZONE_BY_SLUG[slug];
  return zone ? DOT_BY_ZONE[zone] : "bg-muted-foreground";
}

export type MuscleZone = (typeof ZONE_BY_SLUG)[keyof typeof ZONE_BY_SLUG];

export const MUSCLE_ZONES: MuscleZone[] = ["chest", "back", "legs", "shoulders", "arms", "core"];

export const ZONE_LABELS: Record<MuscleZone, string> = {
  chest: "Pecho",
  back: "Espalda",
  legs: "Piernas",
  shoulders: "Hombros",
  arms: "Brazos",
  core: "Core",
};

export function muscleZone(slug: string | null | undefined): MuscleZone | null {
  return slug ? (ZONE_BY_SLUG[slug] ?? null) : null;
}

// Charts need a real color value rather than a Tailwind class, and the
// tokens are already defined as CSS variables so both stay in sync.
export function muscleZoneColor(zone: MuscleZone) {
  return `var(--muscle-${zone})`;
}
