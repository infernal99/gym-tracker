"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Timer } from "lucide-react";
import { useRestTimer } from "@/components/training/rest-timer-provider";
import { formatTime } from "@/components/training/rest-timer";

// The rest keeps running while you check your stats or the exercise list
// mid-workout, so it stays in view above the nav — and one tap takes you
// back to the set. Hidden on the training page itself, which shows the
// full timer card.
export function RestTimerPill() {
  const pathname = usePathname();
  const { rest, remainingMs, done } = useRestTimer();

  if (!rest) return null;
  const trainingHref = `/train/${rest.sessionId}`;
  if (pathname === trainingHref) return null;

  return (
    <div className="shrink-0 px-3 pt-1">
      <Link
        href={trainingHref}
        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-colors duration-fast ease-out ${
          done ? "border-success/40 bg-success/10" : "bg-surface hover:bg-card-hover"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Timer className={`h-4 w-4 shrink-0 ${done ? "text-success" : "text-primary"}`} />
          <span className="truncate text-sm font-medium">
            {done ? "Descanso terminado" : rest.paused ? "Descanso en pausa" : rest.label}
          </span>
        </span>
        <span
          className={`font-mono text-lg font-bold tabular-nums ${done ? "text-success" : "text-foreground"}`}
        >
          {done ? "¡Listo!" : formatTime(Math.ceil(remainingMs / 1000))}
        </span>
      </Link>
    </div>
  );
}
