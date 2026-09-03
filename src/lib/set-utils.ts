// A unilateral exercise logs a separate "left" and "right" row for the same
// set_number, so counting raw rows would double-count every unilateral set
// (2 sets actually done shows as 4). A "serie" is one set_number, regardless
// of how many side-rows back it.
export function countCompletedSets(sets: { set_number: number }[]): number {
  return new Set(sets.map((s) => s.set_number)).size;
}
