// Matches a search query against an exercise name word-by-word rather than
// as one contiguous substring, so "press mancuer" finds "Press banca con
// mancuernas" even though "mancuer" isn't immediately after "press" — people
// remember exercise names in different orders/word choices, and a strict
// substring match makes them think the exercise isn't in the library.
export function matchesExerciseQuery(name: string, query: string): boolean {
  const haystack = name.toLowerCase();
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}
