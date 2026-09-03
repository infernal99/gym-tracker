"use client";

import { useState, useTransition } from "react";
import { Moon, X } from "lucide-react";
import { assignWeekdayAction, unassignWeekdayAction } from "@/lib/actions/routines";

const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];

type Day = {
  id: string;
  name: string;
  is_rest_day: boolean;
  weekday: number | null;
};

export function WeeklyCalendar({ templateId, days }: { templateId: string; days: Day[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const assign = (dayId: string, weekday: number) => {
    setSelectedId(null);
    startTransition(() => {
      assignWeekdayAction(dayId, templateId, weekday);
    });
  };

  const unassign = (dayId: string) => {
    startTransition(() => {
      unassignWeekdayAction(dayId, templateId);
    });
  };

  const unassigned = days.filter((d) => d.weekday === null);

  return (
    <div className="space-y-3 fade-up [animation-delay:60ms]">
      <p className="stat-label">Calendario semanal</p>

      <div className="grid grid-cols-7 gap-1.5">
        {weekdayLabels.map((label, weekday) => {
          const assigned = days.find((d) => d.weekday === weekday);
          return (
            <div
              key={weekday}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dayId = e.dataTransfer.getData("text/plain");
                if (dayId) assign(dayId, weekday);
              }}
              onClick={() => {
                if (selectedId) assign(selectedId, weekday);
              }}
              className={`flex min-h-20 flex-col items-center gap-1 rounded-xl border p-1.5 text-center transition-colors duration-fast ${
                assigned
                  ? "border-primary/30 bg-primary/5"
                  : selectedId
                    ? "cursor-pointer border-dashed border-primary/50 bg-surface hover:bg-accent/40"
                    : "border-dashed bg-surface"
              }`}
            >
              <span className="text-xs font-semibold text-muted-foreground">{label}</span>
              {assigned ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-1">
                  {assigned.is_rest_day ? (
                    <Moon className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : null}
                  <span className="line-clamp-2 text-[11px] font-medium leading-tight">
                    {assigned.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      unassign(assigned.id);
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

      {unassigned.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">
            {selectedId
              ? "Toca un día de la semana para asignarlo"
              : "Arrastra o toca un día para asignarlo a la semana"}
          </p>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((day) => (
              <button
                key={day.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", day.id);
                }}
                onClick={() => setSelectedId((id) => (id === day.id ? null : day.id))}
                disabled={isPending}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors duration-fast ${
                  selectedId === day.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:bg-accent"
                }`}
              >
                {day.is_rest_day && <Moon className="h-3.5 w-3.5" />}
                {day.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
