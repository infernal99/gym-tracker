import type { MuscleZoneChange } from "@/lib/services/stats";
import { ZONE_LABELS, muscleZoneColor } from "@/lib/muscle-colors";

// One row per muscle zone showing the average % change in estimated 1RM
// across that zone's exercises — not kilograms, since a zone mixes a heavy
// compound lift with a light isolation one and an average in kg would just
// track whichever exercise is heaviest. Averaging each exercise's own %
// change instead means 12kg×8→12kg×9 (one more rep, same weight) shows up
// as the modest real improvement it is, weighted the same as any other
// exercise in the zone regardless of load.
export function MuscleChangeList({ changes }: { changes: MuscleZoneChange[] }) {
  if (changes.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay suficientes datos.</p>;
  }

  return (
    <div className="divide-y divide-border/60">
      {changes.map((change) => (
        <div key={change.zone} className="flex items-center gap-3 py-2.5">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: muscleZoneColor(change.zone) }}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted-foreground">{ZONE_LABELS[change.zone]}</p>
            {change.exerciseCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {change.exerciseCount} ejercicio{change.exerciseCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          {change.changePct === null ? (
            <span className="shrink-0 text-xs text-muted-foreground">Nuevo</span>
          ) : change.changePct === 0 ? (
            <span className="shrink-0 text-sm font-semibold text-muted-foreground">Igual</span>
          ) : (
            <span
              className={`shrink-0 text-base font-bold tabular-nums ${
                change.changePct > 0 ? "text-success" : "text-muted-foreground"
              }`}
            >
              {change.changePct > 0 ? "+" : ""}
              {change.changePct.toFixed(1)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
