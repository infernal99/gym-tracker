"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Moon, X } from "lucide-react";
import { assignWeekdayAction, unassignWeekdayAction } from "@/lib/actions/routines";
import { REST_DAY_SENTINEL } from "@/lib/routines-constants";
import type { WeekdaySlot } from "@/lib/services/routines";

const weekdayLabels = ["L", "M", "X", "J", "V", "S", "D"];

// How far the finger has to travel before a press becomes a drag. Below
// this it stays a tap, so the tap-to-select flow still works on the same
// element without the two fighting each other.
const DRAG_THRESHOLD_PX = 6;

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
  const [dragging, setDragging] = useState<{
    id: string;
    label: string;
    x: number;
    y: number;
  } | null>(null);
  const [overWeekday, setOverWeekday] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  // Pointer events rather than HTML5 drag-and-drop: dragstart/drop simply
  // never fire from a touchscreen, so on a phone the calendar could only be
  // filled by tapping. Pointer events cover mouse, touch and pen through
  // one path, at the cost of hit-testing the drop target ourselves.
  const press = useRef<{
    id: string;
    label: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  // Read back in the pointerup handler, where the state value could still
  // be the one from the previous render.
  const overRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const armed = selectedId !== null || dragging !== null;

  const endDrag = () => {
    press.current = null;
    overRef.current = null;
    setDragging(null);
    setOverWeekday(null);
  };

  const assign = (weekday: number, dayId: string) => {
    setSelectedId(null);
    endDrag();
    startTransition(() => {
      assignWeekdayAction(weekday, templateId, dayId);
    });
  };

  const unassign = (weekday: number) => {
    startTransition(() => {
      unassignWeekdayAction(templateId, weekday);
    });
  };

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>, day: TrainingDay) {
    // Capture so we keep receiving moves once the finger leaves the chip —
    // which it does immediately, since the calendar is above it. Recording
    // the press first, and tolerating a failed capture, so a browser that
    // refuses the capture degrades to a chip you can still tap rather than
    // one that ignores you entirely.
    press.current = {
      id: day.id,
      label: day.name,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Without capture the drag ends early if the finger leaves the chip,
      // but the tap still lands.
    }
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const p = press.current;
    if (!p) return;

    if (!p.moved) {
      const distance = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
      if (distance < DRAG_THRESHOLD_PX) return;
      p.moved = true;
    }

    setDragging({ id: p.id, label: p.label, x: e.clientX, y: e.clientY });

    // The ghost is pointer-events-none, so this reaches the cell underneath.
    const target = document
      .elementFromPoint(e.clientX, e.clientY)
      ?.closest<HTMLElement>("[data-weekday]");
    const weekday = target ? Number(target.dataset.weekday) : null;
    overRef.current = weekday;
    setOverWeekday(weekday);
  }

  function handlePointerUp() {
    const p = press.current;
    if (!p) return;

    if (p.moved) {
      const weekday = overRef.current;
      if (weekday !== null) assign(weekday, p.id);
      else endDrag();
    } else {
      // Never crossed the threshold, so it was a tap: arm this day and wait
      // for a tap on a weekday.
      const id = p.id;
      endDrag();
      setSelectedId((current) => (current === id ? null : id));
    }
  }

  const chipClass = (id: string) =>
    `flex touch-none select-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-[color,background-color,border-color,opacity,transform] duration-fast ease-out ${
      dragging?.id === id ? "drag-source" : ""
    } ${
      selectedId === id
        ? "border-primary bg-primary text-primary-foreground"
        : "bg-card hover:bg-accent"
    }`;

  const chipHandlers = (day: TrainingDay) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => handlePointerDown(e, day),
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: endDrag,
  });

  return (
    <div className="space-y-3">
      <p className="stat-label">Calendario semanal</p>

      <div className="grid grid-cols-7 gap-1.5">
        {weekdayLabels.map((label, weekday) => {
          const slot = slots.find((s) => s.weekday === weekday);
          return (
            <div
              key={weekday}
              data-weekday={weekday}
              onClick={() => {
                if (selectedId) assign(weekday, selectedId);
              }}
              className={`drop-zone flex min-h-20 flex-col items-center gap-1 rounded-xl border p-1.5 text-center ${
                overWeekday === weekday
                  ? "drop-zone-active border-primary bg-primary/20 shadow-lg shadow-primary/20"
                  : armed
                    ? "cursor-pointer border-dashed border-primary/50 bg-primary/5 hover:bg-accent/40"
                    : slot
                      ? "border-primary/30 bg-primary/5"
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
              className={chipClass(day.id)}
              {...chipHandlers(day)}
            >
              {day.name}
            </button>
          ))}
          <button
            type="button"
            className={chipClass(REST_DAY_SENTINEL)}
            {...chipHandlers({ id: REST_DAY_SENTINEL, name: "Descanso" })}
          >
            <Moon className="h-3.5 w-3.5" />
            Descanso
          </button>
        </div>
      </div>

      {/* Touch has no native drag image, so the thing being dragged has to be
          drawn. Portaled to <body> so no ancestor's transform can turn this
          fixed position into a relative one. */}
      {mounted &&
        dragging &&
        createPortal(
          <div
            aria-hidden
            className="pointer-events-none fixed z-[100] flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30"
            style={{
              left: dragging.x,
              top: dragging.y,
              transform: "translate(-50%, -140%)",
            }}
          >
            {dragging.id === REST_DAY_SENTINEL && <Moon className="h-3.5 w-3.5" />}
            {dragging.label}
          </div>,
          document.body,
        )}
    </div>
  );
}
