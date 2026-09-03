import type { MuscleZoneChange } from "@/lib/services/stats";
import { ZONE_LABELS, muscleZoneColor } from "@/lib/muscle-colors";
import { DeltaBadge } from "@/components/ui/delta-badge";

// Same row shape as the dashboard's weekly recap (dot/label, value, delta
// chip) applied per muscle zone instead of per overall metric — used for
// both "vs last week" and "vs first record" so progress or a stall in one
// specific zone shows up instead of hiding inside a single total. The value
// is average estimated 1RM (Epley), not volume: the same weight for one
// more rep should read as an improvement even when volume barely moves.
export function MuscleChangeList({ changes }: { changes: MuscleZoneChange[] }) {
  if (changes.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay suficientes datos.</p>;
  }

  return (
    <div className="divide-y divide-border/60">
      {changes.map((change) => (
        <div key={change.zone} className="flex items-center gap-3 py-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: muscleZoneColor(change.zone) }}
          />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {ZONE_LABELS[change.zone]}
          </span>
          <span className="font-semibold tabular-nums">
            {Math.round(change.currentE1rmKg).toLocaleString("es-ES")} kg
          </span>
          <span className="w-14 shrink-0 text-right">
            <DeltaBadge current={change.currentE1rmKg} previous={change.referenceE1rmKg} unit=" kg" />
          </span>
        </div>
      ))}
    </div>
  );
}
