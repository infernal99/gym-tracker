"use client";

import { useEffect, useState } from "react";
import { Pause, Play, SkipForward, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function RestTimer({ seconds }: { seconds: number }) {
  const [duration, setDuration] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  const done = remaining <= 0;
  const progress = duration > 0 ? remaining / duration : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className="rounded-2xl border bg-card px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Descanso</p>
          <p className={`text-3xl font-semibold tabular-nums ${done ? "text-success" : ""}`}>
            {done ? "¡Listo!" : formatTime(remaining)}
          </p>
          <p className="text-xs text-muted-foreground">
            Descanso sugerido: {formatTime(seconds)} min
          </p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth="4"
            />
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
            title={running ? "Pausar" : "Reanudar"}
            onClick={() => setRunning((r) => !r)}
          >
            {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 border-t pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="-15s"
          onClick={() => {
            setDuration((d) => Math.max(0, d - 15));
            setRemaining((r) => Math.max(0, r - 15));
          }}
        >
          <Minus className="h-3.5 w-3.5" />
          15s
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="+15s"
          onClick={() => {
            setDuration((d) => d + 15);
            setRemaining((r) => r + 15);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          15s
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Reiniciar"
          onClick={() => {
            setRemaining(duration);
            setRunning(true);
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" title="Saltar" onClick={() => setRemaining(0)}>
          <SkipForward className="h-3.5 w-3.5" />
          Saltar
        </Button>
      </div>
    </div>
  );
}
