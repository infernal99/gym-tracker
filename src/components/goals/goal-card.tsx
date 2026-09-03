"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { updateGoalProgressAction, deleteGoalAction } from "@/lib/actions/goals";
import { goalProgress, type Goal } from "@/lib/goal-utils";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: ActionResult = { error: null };

export function GoalCard({ goal }: { goal: Goal }) {
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
            <Button type="submit" variant="ghost" size="icon-sm">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
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
