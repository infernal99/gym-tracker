// A per-exercise progression layer, separate from the account-wide XP/level
// system (which only ever goes up as a single number for everything you
// do). This one is scoped to a single exercise, so "estás en press banca"
// actually means something distinct from "press militar" — inspired by
// Symmetry's per-exercise rank, but built as our own simple formula (no
// bodyweight-relative strength-standard tables, which would need data we
// don't have and could easily be wrong) rather than a scientific claim.
export type ExerciseRankTier = "Principiante" | "Novato" | "Intermedio" | "Avanzado" | "Élite";

const XP_PER_SET = 10;
const XP_PER_PR = 100;
const XP_PER_LEVEL = 500;

const TIER_THRESHOLDS: [minLevel: number, tier: ExerciseRankTier][] = [
  [21, "Élite"],
  [11, "Avanzado"],
  [6, "Intermedio"],
  [3, "Novato"],
  [1, "Principiante"],
];

export interface ExerciseRank {
  xp: number;
  level: number;
  /** Progress within the current level, out of XP_PER_LEVEL. */
  xpIntoLevel: number;
  xpPerLevel: number;
  tier: ExerciseRankTier;
}

export function calculateExerciseRank(totalSets: number, prCount: number): ExerciseRank {
  const xp = totalSets * XP_PER_SET + prCount * XP_PER_PR;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const tier = TIER_THRESHOLDS.find(([minLevel]) => level >= minLevel)?.[1] ?? "Principiante";
  return { xp, level, xpIntoLevel, xpPerLevel: XP_PER_LEVEL, tier };
}
