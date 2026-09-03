import type { Database } from "@/types/database.types";

export type ChallengeMetric = Database["public"]["Enums"]["challenge_metric"];
export type ChallengeStatus = Database["public"]["Enums"]["challenge_status"];

export interface Challenge {
  id: string;
  name: string;
  metric: ChallengeMetric;
  exerciseName: string | null;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
}

/** Direction-aware like goalProgress: works whether target > initial (gain) or target < initial (loss). */
export function challengeProgress(
  challenge: Pick<Challenge, "currentValue" | "targetValue" | "initialValue">,
) {
  const range = challenge.targetValue - challenge.initialValue;
  if (range === 0) return challenge.currentValue >= challenge.targetValue ? 100 : 0;
  const pct = ((challenge.currentValue - challenge.initialValue) / range) * 100;
  return Math.max(0, Math.min(100, pct));
}

export function daysRemaining(endDate: string) {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  return days;
}
