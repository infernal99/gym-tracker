"use client";

import { Swords, Trash2 } from "lucide-react";
import { leaveDuelAction } from "@/lib/actions/duels";
import { daysRemaining } from "@/lib/challenge-utils";
import { duelMetricLabels } from "@/lib/validation/duels";
import type { Duel } from "@/lib/services/duels";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

const metricUnit: Record<string, string> = {
  exercise: "kg",
  volume: "kg",
  workouts: "entrenos",
  streak: "días",
};

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Side({
  label,
  value,
  unit,
  winning,
  avatarUrl,
  align,
}: {
  label: string;
  value: number;
  unit: string;
  winning: boolean;
  avatarUrl: string | null;
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-1 flex-col items-center gap-1.5 ${align === "right" ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2" style={{ flexDirection: align === "right" ? "row-reverse" : "row" }}>
        <Avatar className="h-9 w-9">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={label} />}
          <AvatarFallback>{initialsOf(label)}</AvatarFallback>
        </Avatar>
        <p className="max-w-[6rem] truncate text-sm font-medium">{label}</p>
      </div>
      <p className={`text-xl font-bold tabular-nums ${winning ? "text-primary" : "text-muted-foreground"}`}>
        {value} <span className="text-xs font-normal">{unit}</span>
      </p>
    </div>
  );
}

export function DuelCard({ duel }: { duel: Duel }) {
  const unit = metricUnit[duel.metric] ?? "";
  const remaining = daysRemaining(duel.endDate);

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{duel.name}</p>
          <p className="text-xs text-muted-foreground">
            {duelMetricLabels[duel.metric]}
            {duel.exerciseName ? ` · ${duel.exerciseName}` : ""}
          </p>
        </div>
        <form action={leaveDuelAction.bind(null, duel.id)}>
          <ConfirmSubmitButton
            confirmMessage="¿Salir de este duelo?"
            variant="ghost"
            size="icon-sm"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </ConfirmSubmitButton>
        </form>
      </div>

      <div className="flex items-center gap-2">
        <Side
          label={duel.me.displayName}
          value={duel.me.value}
          unit={unit}
          winning={duel.iAmWinning}
          avatarUrl={duel.me.avatarUrl}
          align="left"
        />
        <Swords className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Side
          label={duel.opponent.displayName}
          value={duel.opponent.value}
          unit={unit}
          winning={!duel.iAmWinning}
          avatarUrl={duel.opponent.avatarUrl}
          align="right"
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {duel.finished
          ? duel.iAmWinning
            ? "Terminado — vas ganando"
            : "Terminado — vas perdiendo"
          : remaining <= 0
            ? "Termina hoy"
            : `${remaining} día${remaining === 1 ? "" : "s"} restantes`}
      </p>
    </div>
  );
}
