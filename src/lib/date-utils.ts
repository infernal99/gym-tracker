// Date helpers shared by the services and by client components. Deliberately
// free of "server-only" so the chart components can use the exact same week
// boundaries the services do — a client-side week that starts on a different
// day than the server's would silently disagree about "this week".

/** Monday-start week containing `date`, at 00:00. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday = 0
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The `date` at 00:00. */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * YYYY-MM-DD for grouping timestamps into calendar days. Uses the runtime's
 * own timezone via the sv-SE locale (whose short date format is already
 * ISO-shaped), rather than `toISOString().slice(0, 10)`, which would answer
 * in UTC and put a late-evening session on the following day for anyone east
 * of Greenwich.
 */
export function dayKey(date: Date | string): string {
  return (typeof date === "string" ? new Date(date) : date).toLocaleDateString("sv-SE");
}

/**
 * Turns a YYYY-MM-DD day key back into a Date at local midnight. `new
 * Date("2026-09-04")` would parse as *UTC* midnight, which is the previous
 * evening for anyone west of Greenwich — so the parts are passed separately.
 */
export function parseDayKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from `from` to `to`, ignoring the time of day. */
export function daysBetween(from: Date | string, to: Date | string): number {
  const toDate = (value: Date | string) =>
    typeof value === "string"
      ? /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? parseDayKey(value)
        : new Date(value)
      : value;
  const a = startOfDay(toDate(from));
  const b = startOfDay(toDate(to));
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * Consecutive calendar days with at least one session, counting back from
 * today. A streak survives one missed day only in the sense that it's still
 * counted while yesterday was trained and today hasn't happened yet — miss
 * two days and it's over.
 */
export function currentStreak(completedAtDates: string[]): number {
  if (completedAtDates.length === 0) return 0;

  const days = Array.from(new Set(completedAtDates.map(dayKey))).sort().reverse();
  const today = startOfDay(new Date());

  if (daysBetween(days[0], today) > 1) return 0;

  let streak = 0;
  const expected = parseDayKey(days[0]);
  for (const day of days) {
    if (day !== dayKey(expected)) break;
    streak += 1;
    expected.setDate(expected.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive training days anywhere in the history given. */
export function longestStreak(completedAtDates: string[]): number {
  const days = Array.from(new Set(completedAtDates.map(dayKey))).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of days) {
    run = previous && daysBetween(previous, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}
