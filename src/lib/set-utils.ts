// A unilateral exercise logs a separate "left" and "right" row for the same
// set_number, so counting raw rows would double-count every unilateral set
// (2 sets actually done shows as 4). A "serie" is one set_number, regardless
// of how many side-rows back it.
//
// And a unilateral serie isn't done until both sides are in — counting it
// the moment the first side landed made the progress count, the exercise
// strip's checkmark and the stats all claim a finished set while the other
// arm was still to go.
export function countCompletedSets(sets: { set_number: number; side: string }[]): number {
  const sidesBySet = new Map<number, Set<string>>();
  for (const s of sets) {
    const sides = sidesBySet.get(s.set_number) ?? new Set<string>();
    sides.add(s.side);
    sidesBySet.set(s.set_number, sides);
  }
  let completed = 0;
  for (const sides of sidesBySet.values()) {
    if (sides.has("both") || (sides.has("left") && sides.has("right"))) completed++;
  }
  return completed;
}

// Shared by the session's exercise strip and the swap-exercise picker, so
// "done" means the same thing in both — otherwise the picker could offer an
// exercise the strip already shows checked off, or the other way around.
export function isExerciseDone(exercise: {
  target_sets: number | null;
  sets: { set_number: number; side: string }[];
}): boolean {
  const completed = countCompletedSets(exercise.sets);
  return completed > 0 && completed >= (exercise.target_sets ?? 1);
}
