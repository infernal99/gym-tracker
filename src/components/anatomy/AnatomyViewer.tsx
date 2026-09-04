"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Hand } from "lucide-react";
import { MuscleLegend } from "./MuscleLegend";
import { AnatomyControls, type AnatomyView } from "./AnatomyControls";
import { ANATOMY_GROUP_LABELS, ANATOMY_GROUP_ZONE, type AnatomyGroup } from "@/lib/anatomy-groups";
import { muscleZoneColor, type MuscleZone } from "@/lib/muscle-colors";

// R3F's Canvas can't be server-rendered, and the three.js chunk is a few
// hundred KB — split into its own client-only chunk so it only loads once
// this card is actually reached, not as part of Estadísticas' initial load.
const MuscleBodyScene = dynamic(
  () => import("./anatomy-scene").then((m) => m.MuscleBodyScene),
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

export function AnatomyViewer({ info }: { info: Record<MuscleZone, ZoneInfo> }) {
  const [active, setActive] = useState<AnatomyGroup | null>(null);
  const [hovered, setHovered] = useState<AnatomyGroup | null>(null);
  const [view, setView] = useState<AnatomyView>("front");

  function toggle(group: AnatomyGroup) {
    setActive((current) => (current === group ? null : group));
  }

  const zone = active ? ANATOMY_GROUP_ZONE[active] : null;
  const activeInfo = zone ? info[zone] : null;

  return (
    <div className="space-y-3">
      <MuscleLegend active={active} onSelect={toggle} />

      <div className="h-64 w-full overflow-hidden rounded-xl bg-muted/40">
        <MuscleBodyScene
          active={active}
          hovered={hovered}
          view={view}
          onSelect={toggle}
          onHover={setHovered}
        />
      </div>

      <AnatomyControls view={view} onChange={setView} />

      <div className="min-h-16 rounded-xl border bg-surface p-3">
        {active && zone && activeInfo ? (
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: muscleZoneColor(zone) }} />
              {ANATOMY_GROUP_LABELS[active]}
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

      <p className="text-[11px] text-muted-foreground/70">
        Modelo anatómico:{" "}
        <a
          href="https://z-anatomy.com"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          Z-Anatomy
        </a>{" "}
        / BodyParts3D — CC BY-SA 4.0
      </p>
    </div>
  );
}
