"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Hand } from "lucide-react";
import { MUSCLE_ZONES, ZONE_LABELS, muscleZoneColor, type MuscleZone } from "@/lib/muscle-colors";

// R3F's Canvas can't be server-rendered — split into its own client-only
// chunk so the (few hundred KB) three.js bundle only loads once this card
// is actually reached, not as part of the Estadísticas page's initial load.
const MuscleBodyScene = dynamic(
  () => import("./muscle-body-scene").then((m) => m.MuscleBodyScene),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-xl bg-muted" /> },
);

export interface ZoneInfo {
  setsThisWeek: number;
  sets: number;
  volumeKg: number;
  changePct: number | null;
  status: "low" | "optimal" | "high";
}

const STATUS_LABEL: Record<ZoneInfo["status"], string> = {
  low: "Poco trabajado esta semana",
  optimal: "Volumen óptimo esta semana",
  high: "Volumen alto esta semana",
};

export function MuscleBody3D({ info }: { info: Record<MuscleZone, ZoneInfo> }) {
  const [active, setActive] = useState<MuscleZone | null>(null);

  function toggle(zone: MuscleZone) {
    setActive((current) => (current === zone ? null : zone));
  }

  const activeInfo = active ? info[active] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_ZONES.map((zone) => (
          <button
            key={zone}
            type="button"
            onClick={() => toggle(zone)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ${
              active === zone
                ? "text-white"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
            style={active === zone ? { backgroundColor: muscleZoneColor(zone) } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: muscleZoneColor(zone) }}
            />
            {ZONE_LABELS[zone]}
          </button>
        ))}
      </div>

      <div className="h-56 w-full overflow-hidden rounded-xl bg-muted/40">
        <MuscleBodyScene active={active} onSelect={toggle} />
      </div>

      <div className="min-h-16 rounded-xl border bg-surface p-3">
        {activeInfo ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: muscleZoneColor(active!) }}
              />
              {ZONE_LABELS[active!]}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeInfo.setsThisWeek} series esta semana ·{" "}
              {activeInfo.sets} series / {Math.round(activeInfo.volumeKg).toLocaleString("es-ES")} kg
              (12 semanas)
            </p>
            <p className="text-sm text-muted-foreground">{STATUS_LABEL[activeInfo.status]}</p>
            {activeInfo.changePct !== null && (
              <p className={`text-sm font-medium ${activeInfo.changePct >= 0 ? "text-success" : "text-destructive"}`}>
                {activeInfo.changePct >= 0 ? "+" : ""}
                {activeInfo.changePct.toFixed(1)}% de 1RM estimado vs la semana pasada
              </p>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Hand className="h-3.5 w-3.5" />
            Toca un grupo muscular (o gira el modelo y toca directamente) para ver su detalle.
          </p>
        )}
      </div>
    </div>
  );
}
