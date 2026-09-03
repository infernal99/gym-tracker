import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateCurrentStreak } from "@/lib/services/dashboard";
import type { Database } from "@/types/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export interface ProfileStats {
  totalWorkouts: number;
  totalVolumeKg: number;
  totalPrs: number;
  currentStreak: number;
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  const [{ count: totalWorkouts }, { data: sessions }, { count: totalPrs }] = await Promise.all([
    supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase
      .from("workout_sessions")
      .select("completed_at, total_volume_kg")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(90),
    supabase
      .from("personal_records")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const totalVolumeKg = (sessions ?? []).reduce((sum, s) => sum + s.total_volume_kg, 0);
  const currentStreak = calculateCurrentStreak(
    (sessions ?? []).map((s) => s.completed_at as string),
  );

  return {
    totalWorkouts: totalWorkouts ?? 0,
    totalVolumeKg,
    totalPrs: totalPrs ?? 0,
    currentStreak,
  };
}
