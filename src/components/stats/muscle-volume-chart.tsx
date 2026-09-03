"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeeklyMuscleVolume } from "@/lib/services/stats";
import { MUSCLE_ZONES, ZONE_LABELS, muscleZoneColor, type MuscleZone } from "@/lib/muscle-colors";

function formatKg(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
}

// Weekly volume split by muscle zone. Stacked so the bar height still reads
// as total weekly work, while the colors show where it went — the whole
// point being to spot a zone that's been quietly neglected for weeks.
export function MuscleVolumeChart({ weeks }: { weeks: WeeklyMuscleVolume[] }) {
  const [hiddenZones, setHiddenZones] = useState<MuscleZone[]>([]);

  const activeZones = MUSCLE_ZONES.filter(
    (zone) => !hiddenZones.includes(zone) && weeks.some((w) => w.byZone[zone] > 0),
  );
  const zonesWithData = MUSCLE_ZONES.filter((zone) => weeks.some((w) => w.byZone[zone] > 0));

  const data = weeks.map((week) => ({
    label: week.label,
    ...week.byZone,
  }));

  function toggleZone(zone: MuscleZone) {
    setHiddenZones((current) =>
      current.includes(zone) ? current.filter((z) => z !== zone) : [...current, zone],
    );
  }

  if (zonesWithData.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Todavía no hay series registradas en este periodo.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {zonesWithData.map((zone) => {
          const active = !hiddenZones.includes(zone);
          return (
            <button
              key={zone}
              type="button"
              onClick={() => toggleZone(zone)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity duration-fast ${
                active ? "bg-card" : "bg-transparent opacity-40"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: muscleZoneColor(zone) }}
              />
              {ZONE_LABELS[zone]}
            </button>
          );
        })}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatKg}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.75rem",
                fontSize: "0.8rem",
              }}
              formatter={(value, name) => [
                `${Math.round(Number(value)).toLocaleString("es-ES")} kg`,
                ZONE_LABELS[name as MuscleZone] ?? String(name),
              ]}
            />
            {activeZones.map((zone) => (
              <Bar
                key={zone}
                dataKey={zone}
                stackId="volume"
                fill={muscleZoneColor(zone)}
                radius={zone === activeZones[activeZones.length - 1] ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
