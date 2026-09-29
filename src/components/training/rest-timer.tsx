"use client";

import { Pause, Play, SkipForward, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRestTimer } from "@/components/training/rest-timer-provider";

export function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Only draws the session's rest — the counting itself lives in
// RestTimerProvider, so it carries on while you're on other pages or
// looking at another exercise.
export function RestTimerCard({
  sessionId,
  currentExerciseName,
}: {
  sessionId: string;
  currentExerciseName: string | null;
}) {
  const { rest, remainingMs, done, togglePause, shift, restart, skip } = useRestTimer();
  if (!rest || rest.sessionId !== sessionId) return null;

  const remaining = Math.ceil(remainingMs / 1000);
  const progress = rest.durationMs > 0 ? remainingMs / rest.durationMs : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const fromOtherExercise = rest.exerciseName && rest.exerciseName !== currentExerciseName;

  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors duration-normal ${done ? "border-success/30 bg-success/5" : "bg-surface"}`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="stat-label">{rest.label}</p>
          <p
            className={`font-mono text-3xl font-bold tabular-nums ${done ? "text-success" : "text-foreground"}`}
          >
            {done ? "¡Listo!" : formatTime(remaining)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {fromOtherExercise
              ? `Tras ${rest.exerciseName}`
              : `Sugerido ${formatTime(Math.round(rest.durationMs / 1000))}`}
          </p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={RING_RADIUS} fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle
              cx="32"
              cy="32"
              r={RING_RADIUS}
              fill="none"
              stroke={done ? "var(--success)" : "var(--primary)"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            title={rest.paused ? "Reanudar" : "Pausar"}
            onClick={togglePause}
          >
            {rest.paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 border-t pt-2">
        <Button type="button" variant="ghost" size="sm" title="-15s" onClick={() => shift(-15_000)}>
          <Minus className="h-3.5 w-3.5" />
          15s
        </Button>
        <Button type="button" variant="ghost" size="sm" title="+15s" onClick={() => shift(15_000)}>
          <Plus className="h-3.5 w-3.5" />
          15s
        </Button>
        <Button type="button" variant="ghost" size="sm" title="Reiniciar" onClick={restart}>
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" title="Saltar" onClick={skip}>
          <SkipForward className="h-3.5 w-3.5" />
          Saltar
        </Button>
      </div>
    </div>
  );
}
