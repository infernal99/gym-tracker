import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseDifficulty } from "@/types/database.types";

export async function listMuscleGroups() {
  const supabase = await createClient();
  const { data } = await supabase.from("muscle_groups").select("*").order("name");
  return data ?? [];
}

export async function listEquipment() {
  const supabase = await createClient();
  const { data } = await supabase.from("equipment").select("*").order("name");
  return data ?? [];
}

export type ExerciseFilters = {
  search?: string;
  muscleGroupId?: string;
  equipmentId?: string;
  difficulty?: ExerciseDifficulty;
};

export async function listExercises(filters: ExerciseFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("exercises")
    .select("*, muscle_groups(name, slug), equipment(name, slug)")
    .order("name");

  if (filters.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }
  if (filters.muscleGroupId) {
    query = query.eq("primary_muscle_group_id", filters.muscleGroupId);
  }
  if (filters.equipmentId) {
    query = query.eq("equipment_id", filters.equipmentId);
  }
  if (filters.difficulty) {
    query = query.eq("difficulty", filters.difficulty);
  }

  const { data } = await query;
  return data ?? [];
}

export async function getExerciseBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*, muscle_groups(name, slug), equipment(name, slug)")
    .eq("slug", slug)
    .single();
  return data;
}
