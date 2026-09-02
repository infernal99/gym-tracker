"use client";

import { useEffect, useState } from "react";
import { Pause, Play, SkipForward, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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

  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
      <div>
        <p className="text-xs text-muted-foreground">Descanso</p>
        <p className={`text-xl font-semibold tabular-nums ${done ? "text-primary" : ""}`}>
          {done ? "¡Listo!" : formatTime(remaining)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="-15s"
          onClick={() => {
            setDuration((d) => Math.max(0, d - 15));
            setRemaining((r) => Math.max(0, r - 15));
          }}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="+15s"
          onClick={() => {
            setDuration((d) => d + 15);
            setRemaining((r) => r + 15);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title={running ? "Pausar" : "Reanudar"}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Reiniciar"
          onClick={() => {
            setRemaining(duration);
            setRunning(true);
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          title="Saltar"
          onClick={() => setRemaining(0)}
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
