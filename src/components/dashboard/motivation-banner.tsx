import { CalendarOff, Flame } from "lucide-react";
import type { WeeklySummary } from "@/lib/services/weekly-summary";

// A single, situational nudge — never more than one at a time, and nothing
// at all when the user is on track, so the dashboard doesn't nag someone
// who already trained today.
export function MotivationBanner({ summary }: { summary: WeeklySummary }) {
  const { currentStreak, trainedToday, daysSinceLastWorkout } = summary;

  if (daysSinceLastWorkout === null || trainedToday) return null;

  if (currentStreak >= 2) {
    return (
      <div className="fade-up flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Flame className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            Racha de {currentStreak} días en riesgo
          </p>
          <p className="text-xs text-muted-foreground">
            Entrena hoy para no perderla.
          </p>
        </div>
      </div>
    );
  }

  if (daysSinceLastWorkout >= 4) {
    return (
      <div className="fade-up flex items-center gap-3 rounded-xl border bg-card p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CalendarOff className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {daysSinceLastWorkout} días sin entrenar
          </p>
          <p className="text-xs text-muted-foreground">
            Vuelve hoy aunque sea con una sesión corta.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
