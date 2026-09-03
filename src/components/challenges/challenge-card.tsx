"use client";

import { CalendarClock, CheckCircle2, Trash2 } from "lucide-react";
import { deleteChallengeAction } from "@/lib/actions/challenges";
import { challengeProgress, daysRemaining, type Challenge } from "@/lib/challenge-utils";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

const metricUnit: Record<string, string> = {
  custom: "kg",
  exercise: "kg",
  workouts: "entrenos",
  consistency: "entrenos",
};

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const pct = challengeProgress(challenge);
  const completed = challenge.status === "completed";
  const remaining = daysRemaining(challenge.endDate);
  const expired = !completed && remaining < 0;
  const unit = metricUnit[challenge.metric] ?? "";

  return (
    <div
      className={`space-y-3 rounded-xl border p-4 transition-colors duration-normal ${
        completed
          ? "border-success/30 bg-success/5"
          : expired
            ? "border-destructive/20 bg-destructive/5"
            : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-semibold">
            {completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
            {challenge.name}
          </p>
          {challenge.exerciseName && (
            <p className="text-sm text-muted-foreground">{challenge.exerciseName}</p>
          )}
        </div>
        <form action={deleteChallengeAction.bind(null, challenge.id)}>
          <ConfirmSubmitButton
            confirmMessage="¿Eliminar este reto? No se puede deshacer."
            variant="ghost"
            size="icon-sm"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-[width] duration-emphasis ease-out ${
              completed ? "bg-success" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-sm tabular-nums">
          <span className="text-muted-foreground">
            {challenge.currentValue} / {challenge.targetValue} {unit}
          </span>
          <span className={`font-semibold ${completed ? "text-success" : ""}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5" />
        {completed
          ? "Completado"
          : expired
            ? "Plazo terminado"
            : remaining === 0
              ? "Termina hoy"
              : `${remaining} día${remaining === 1 ? "" : "s"} restantes`}
      </div>
    </div>
  );
}
