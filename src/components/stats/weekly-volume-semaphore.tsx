import { HIGH_SETS_THRESHOLD, LOW_SETS_THRESHOLD, type VolumeStatus, type ZoneWeeklyVolume } from "@/lib/services/stats";
import { ZONE_LABELS } from "@/lib/muscle-colors";

const STATUS_META: Record<VolumeStatus, { label: string; dot: string; text: string; border: string }> = {
  low: { label: "Bajo", dot: "bg-muted-foreground", text: "text-muted-foreground", border: "border-border" },
  optimal: { label: "Óptimo", dot: "bg-success", text: "text-success", border: "border-success/30" },
  high: { label: "Alto", dot: "bg-primary", text: "text-primary", border: "border-primary/30" },
};

// Weekly set count per muscle group against rough hypertrophy landmarks —
// not a prescription, just a nudge toward a group that's gone quiet (0
// sets shows up as clearly as any other) or one that might be creeping
// past the point of useful return.
export function WeeklyVolumeSemaphore({ zones }: { zones: ZoneWeeklyVolume[] }) {
  return (
    <div className="space-y-2">
      {zones.map((z) => {
        const meta = STATUS_META[z.status];
        return (
          <div
            key={z.zone}
            className={`flex items-center justify-between rounded-lg border p-2.5 ${meta.border}`}
          >
            <div className="flex items-center gap-2.5">
              <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
              <span className="text-sm">{ZONE_LABELS[z.zone]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="tabular-nums text-muted-foreground">{z.sets} series</span>
              <span className={`font-medium ${meta.text}`}>{meta.label}</span>
            </div>
          </div>
        );
      })}
      <p className="pt-1 text-xs text-muted-foreground">
        Orientativo: menos de {LOW_SETS_THRESHOLD} series/semana suele ser poco para progresar, más de{" "}
        {HIGH_SETS_THRESHOLD} rara vez aporta algo extra.
      </p>
    </div>
  );
}
