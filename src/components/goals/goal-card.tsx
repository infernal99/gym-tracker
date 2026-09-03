"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Pencil, TrendingUp, Trash2 } from "lucide-react";
import { updateGoalProgressAction, deleteGoalAction } from "@/lib/actions/goals";
import { goalProgress, type Goal } from "@/lib/goal-utils";
import type { GoalEta } from "@/lib/calculations/strength";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";

const initialState: ActionResult = { error: null };

function formatEta(eta: GoalEta) {
  if (eta.reached) return null;
  if (eta.weeksRemaining === null) {
    return "Tu progreso reciente en este ejercicio está plano o bajando — sin una tendencia clara no se puede estimar cuándo lo alcanzarás.";
  }
  if (eta.weeksRemaining === 0) return "¡Ya deberías estar rozándolo en tu próxima sesión!";
  const date = eta.projectedDate
    ? new Date(eta.projectedDate).toLocaleDateString("es-ES", { day: "numeric", month: "long" })
    : null;
  const weeksLabel = eta.weeksRemaining === 1 ? "1 semana" : `${eta.weeksRemaining} semanas`;
  return `A tu ritmo actual (+${eta.weeklyRateKg.toFixed(1)} kg/semana de 1RM estimado), lo alcanzarías en ~${weeksLabel}${date ? ` (sobre el ${date})` : ""}.`;
}

export function GoalCard({ goal, eta = null }: { goal: Goal; eta?: GoalEta | null }) {
  const [editing, setEditing] = useState(false);
  const boundAction = updateGoalProgressAction.bind(null, goal.id);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const pct = goalProgress(goal);
  const completed = goal.status === "completed";

  return (
    <div
      className={`space-y-3 rounded-xl border p-4 transition-colors duration-normal ${
        completed ? "border-success/30 bg-success/5" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-semibold">
            {completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
            {goal.title}
          </p>
          {goal.exerciseName && (
            <p className="text-sm text-muted-foreground">{goal.exerciseName}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!completed && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditing((e) => !e)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <form action={deleteGoalAction.bind(null, goal.id)}>
            <ConfirmSubmitButton
              confirmMessage="¿Eliminar este objetivo? No se puede deshacer."
              variant="ghost"
              size="icon-sm"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </ConfirmSubmitButton>
          </form>
        </div>
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
            {goal.currentValue ?? goal.initialValue ?? 0} / {goal.targetValue} {goal.unit}
          </span>
          <span className={`font-semibold ${completed ? "text-success" : ""}`}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      {!completed && eta && formatEta(eta) && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {formatEta(eta)}
        </p>
      )}

      {editing && !completed && (
        <form action={formAction} className="flex items-center gap-2">
          <Input
            name="currentValue"
            type="number"
            step="0.1"
            defaultValue={goal.currentValue ?? goal.initialValue ?? ""}
            placeholder={`Actual (${goal.unit})`}
            className="h-9"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "..." : "Guardar"}
          </Button>
        </form>
      )}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
