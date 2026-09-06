// Standard Olympic plate set, heaviest first — greedy loading (always take
// the biggest plate that still fits) is optimal here because every weight
// divides the one above it evenly, so it can never "get stuck" needing a
// combination a greedy pass would miss.
export const AVAILABLE_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25] as const;

export const DEFAULT_BAR_WEIGHT_KG = 20;

export interface PlateBreakdown {
  /** One entry per plate size actually used, heaviest first. */
  plates: { weightKg: number; count: number }[];
  /** Total the plates alone add per side. */
  perSideKg: number;
  /** Bar + both sides — what actually ends up on the bar. */
  achievedKg: number;
  /** How far achievedKg is from the requested weight (0 = exact). */
  differenceKg: number;
}

// Splits (targetKg - barWeightKg) across both sides of the bar and greedily
// fills each side from the available plate sizes. Weight below the bar's
// own weight, or with nothing left to add, still returns a valid (empty)
// breakdown rather than negative plates.
export function calculatePlates(targetKg: number, barWeightKg: number = DEFAULT_BAR_WEIGHT_KG): PlateBreakdown {
  const perSideTarget = Math.max(0, (targetKg - barWeightKg) / 2);

  const plates: { weightKg: number; count: number }[] = [];
  let remaining = perSideTarget;
  // Half-kilo rounding error accumulates across plate sizes otherwise (e.g.
  // 7.0 read back as 6.9999999 and skipping the last 1.25 plate it needs).
  const EPSILON = 1e-6;

  for (const plate of AVAILABLE_PLATES_KG) {
    const count = Math.floor((remaining + EPSILON) / plate);
    if (count > 0) {
      plates.push({ weightKg: plate, count });
      remaining -= count * plate;
    }
  }

  const perSideKg = plates.reduce((sum, p) => sum + p.weightKg * p.count, 0);
  const achievedKg = barWeightKg + perSideKg * 2;

  return {
    plates,
    perSideKg,
    achievedKg,
    differenceKg: Math.round((targetKg - achievedKg) * 100) / 100,
  };
}
