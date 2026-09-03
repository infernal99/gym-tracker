import type { Database } from "@/types/database.types";

export type GoalType = Database["public"]["Enums"]["goal_type"];
export type GoalStatus = Database["public"]["Enums"]["goal_status"];

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  exerciseName: string | null;
  initialValue: number | null;
  currentValue: number | null;
  targetValue: number;
  unit: string;
  targetDate: string | null;
  status: GoalStatus;
  createdAt: string;
}

export function goalProgress(goal: Pick<Goal, "initialValue" | "currentValue" | "targetValue">) {
  const current = goal.currentValue ?? goal.initialValue ?? 0;
  const initial = goal.initialValue ?? 0;
  const target = goal.targetValue;

  const range = target - initial;
  if (range === 0) return current >= target ? 100 : 0;

  const pct = ((current - initial) / range) * 100;
  return Math.max(0, Math.min(100, pct));
}
