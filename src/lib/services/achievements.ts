import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AchievementWithProgress {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  progress: number;
  unlockedAt: string | null;
}

export async function listAchievementsWithProgress(
  userId: string,
): Promise<AchievementWithProgress[]> {
  const supabase = await createClient();
  const [{ data: achievements }, { data: userAchievements }] = await Promise.all([
    supabase.from("achievements").select("*").order("category"),
    supabase.from("user_achievements").select("*").eq("user_id", userId),
  ]);

  const byAchievementId = new Map((userAchievements ?? []).map((ua) => [ua.achievement_id, ua]));

  return (achievements ?? []).map((a) => {
    const ua = byAchievementId.get(a.id);
    return {
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      category: a.category,
      progress: ua?.progress ?? 0,
      unlockedAt: ua?.unlocked_at ?? null,
    };
  });
}
