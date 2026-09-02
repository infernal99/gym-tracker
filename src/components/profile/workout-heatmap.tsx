"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type HeatmapSession = {
  id: string;
  name: string;
  completed_at: string;
  duration_seconds: number | null;
  total_volume_kg: number;
};

const WEEKS = 53;
const MONTH_LABELS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const DOW_LABELS = ["", "Lun", "", "Mié", "", "Vie", ""];

// Local calendar date, not UTC — toISOString() would shift the date for
// anyone west of UTC (a session logged at 23:00 local would land on
// tomorrow's UTC date and miss its own cell).
function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function levelFor(totalVolume: number) {
  if (totalVolume <= 0) return 0;
  if (totalVolume < 2000) return 1;
  if (totalVolume < 4000) return 2;
  if (totalVolume < 6000) return 3;
  return 4;
}

const LEVEL_CLASSES = [
  "bg-muted",
  "bg-success/25",
  "bg-success/50",
  "bg-success/75",
  "bg-success",
];

export function WorkoutHeatmap({ sessions }: { sessions: HeatmapSession[] }) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, HeatmapSession[]>();
    for (const s of sessions) {
      const key = toKey(new Date(s.completed_at));
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [sessions]);

  const { weeks, monthMarkers } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (WEEKS * 7 - 1));
    start.setDate(start.getDate() - start.getDay());

    const allDays: Date[] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      allDays.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    const monthMarkers: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const first = week[0];
      if (first && first.getMonth() !== lastMonth) {
        lastMonth = first.getMonth();
        monthMarkers.push({ weekIndex: i, label: MONTH_LABELS[lastMonth] });
      }
    });

    return { weeks, monthMarkers };
  }, []);

  const total = sessions.length;
  const selectedSessions = selectedKey ? byDate.get(selectedKey) ?? [] : [];
  const selectedDateLabelRaw = selectedKey
    ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const selectedDateLabel =
    selectedDateLabelRaw.charAt(0).toUpperCase() + selectedDateLabelRaw.slice(1);

  return (
    <>
      <div className="flex">
        <div className="mr-1 mt-5 flex shrink-0 flex-col gap-[3px] text-[10px] text-muted-foreground">
          {DOW_LABELS.map((label, i) => (
            <span key={i} className="flex h-3 items-center">
              {label}
            </span>
          ))}
        </div>
        <div ref={scrollRef} className="overflow-x-auto">
          <div className="min-w-max">
            <div className="relative mb-1 h-4 text-xs text-muted-foreground">
              {monthMarkers.map((m) => (
                <span
                  key={`${m.label}-${m.weekIndex}`}
                  className="absolute capitalize"
                  style={{ left: `${m.weekIndex * 15}px` }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="h-3 w-3" />;
                  const key = toKey(day);
                  const isFuture = day > new Date();
                  const daySessions = byDate.get(key) ?? [];
                  const volume = daySessions.reduce((s, x) => s + x.total_volume_kg, 0);
                  const level = levelFor(volume);
                  return (
                    <button
                      key={di}
                      type="button"
                      disabled={isFuture}
                      onClick={() => setSelectedKey(key)}
                      title={day.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                      })}
                      className={`h-3 w-3 rounded-[3px] transition-transform hover:scale-125 disabled:pointer-events-none disabled:opacity-0 ${LEVEL_CLASSES[level]}`}
                    />
                  );
                })}
              </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{total} entrenamientos en el último año</span>
        <span className="flex items-center gap-1">
          Menos
          {LEVEL_CLASSES.map((c, i) => (
            <span key={i} className={`h-3 w-3 rounded-[3px] ${c}`} />
          ))}
          Más
        </span>
      </div>

      <Dialog open={!!selectedKey} onOpenChange={(open) => !open && setSelectedKey(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedDateLabel}</DialogTitle>
          </DialogHeader>
          {selectedSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entrenaste este día.</p>
          ) : (
            <div className="space-y-2">
              {selectedSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/train/history/${s.id}`}
                  className="block rounded-xl border px-3 py-2 hover:bg-accent/50"
                >
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}min · ` : ""}
                    {s.total_volume_kg} kg de volumen
                  </p>
                </Link>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
