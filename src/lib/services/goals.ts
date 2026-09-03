import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/lib/goal-utils";

export async function listGoals(userId: string): Promise<Goal[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("*, exercises(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((g) => ({
    id: g.id,
    type: g.type,
    title: g.title,
    exerciseName: g.exercises?.name ?? null,
    initialValue: g.initial_value,
    currentValue: g.current_value,
    targetValue: g.target_value,
    unit: g.unit,
    targetDate: g.target_date,
    status: g.status,
    createdAt: g.created_at,
  }));
}
