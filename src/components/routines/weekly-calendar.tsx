"use client";

import { useState, useTransition } from "react";
import { Moon, X } from "lucide-react";
import { assignWeekdayAction, unassignWeekdayAction } from "@/lib/actions/routines";
import { REST_DAY_SENTINEL } from "@/lib/routines-constants";
import type { WeekdaySlot } from "@/lib/services/routines";

const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];

type TrainingDay = { id: string; name: string };

export function WeeklyCalendar({
  templateId,
  trainingDays,
  slots,
}: {
  templateId: string;
  trainingDays: TrainingDay[];
  slots: WeekdaySlot[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const assign = (weekday: number, dayId: string) => {
    setSelectedId(null);
    startTransition(() => {
      assignWeekdayAction(weekday, templateId, dayId);
    });
  };

  const unassign = (weekday: number) => {
    startTransition(() => {
      unassignWeekdayAction(templateId, weekday);
    });
  };

  return (
    <div className="space-y-3 fade-up [animation-delay:60ms]">
      <p className="stat-label">Calendario semanal</p>

      <div className="grid grid-cols-7 gap-1.5">
        {weekdayLabels.map((label, weekday) => {
          const slot = slots.find((s) => s.weekday === weekday);
          return (
            <div
              key={weekday}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dayId = e.dataTransfer.getData("text/plain");
                if (dayId) assign(weekday, dayId);
              }}
              onClick={() => {
                if (selectedId) assign(weekday, selectedId);
              }}
              className={`flex min-h-20 flex-col items-center gap-1 rounded-xl border p-1.5 text-center transition-colors duration-fast ${
                slot
                  ? "border-primary/30 bg-primary/5"
                  : selectedId
                    ? "cursor-pointer border-dashed border-primary/50 bg-surface hover:bg-accent/40"
                    : "border-dashed bg-surface"
              }`}
            >
              <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              {slot ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-1">
                  {slot.isRestDay ? <Moon className="h-3.5 w-3.5 text-muted-foreground" /> : null}
                  <span className="line-clamp-2 text-[11px] font-medium leading-tight">
                    {slot.dayName}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      unassign(weekday);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <span className="flex-1" />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          {selectedId
            ? "Toca un día de la semana para asignarlo"
            : "Arrastra o toca un día para asignarlo a la semana (puedes repetirlo)"}
        </p>
        <div className="flex flex-wrap gap-2">
          {trainingDays.map((day) => (
            <button
              key={day.id}
              type="button"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", day.id);
              }}
              onClick={() => setSelectedId((id) => (id === day.id ? null : day.id))}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-fast ${
                selectedId === day.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-accent"
              }`}
            >
              {day.name}
            </button>
          ))}
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", REST_DAY_SENTINEL);
            }}
            onClick={() =>
              setSelectedId((id) => (id === REST_DAY_SENTINEL ? null : REST_DAY_SENTINEL))
            }
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-fast ${
              selectedId === REST_DAY_SENTINEL
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card hover:bg-accent"
            }`}
          >
            <Moon className="h-3.5 w-3.5" />
            Descanso
          </button>
        </div>
      </div>
    </div>
  );
}
