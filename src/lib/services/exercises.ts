import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExerciseDifficulty } from "@/types/database.types";
import type { Database } from "@/types/database.types";

type MovementType = Database["public"]["Enums"]["movement_type"];

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "ejercicio"}-${suffix}`;
}

// A user's own exercise — only they can see it (exercises_select RLS).
// Shared by the "+" on Ejercicios and by "Crear ejercicio" inside a
// routine day, so both make exactly the same kind of row.
export async function createCustomExercise(
  userId: string,
  input: {
    name: string;
    muscleGroupId: string;
    equipmentId?: string | null;
    difficulty?: ExerciseDifficulty;
    movementType?: MovementType;
    description?: string | null;
  },
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .insert({
      name: input.name,
      slug: slugify(input.name),
      primary_muscle_group_id: input.muscleGroupId,
      equipment_id: input.equipmentId || null,
      difficulty: input.difficulty ?? "intermediate",
      movement_type: input.movementType ?? "compound",
      description: input.description || null,
      is_custom: true,
      created_by: userId,
    })
    .select("id, slug")
    .single();
  return data;
}

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
  movementType?: MovementType;
};

export async function listExercises(filters: ExerciseFilters = {}) {
  const supabase = await createClient();
  let query = supabase
    .from("exercises")
    .select("*, muscle_groups(name, slug), equipment(name, slug)")
    .order("name");

  if (filters.search) {
    // search_text = lower(name + alternate_names), so "bench press" also
    // finds "Press banca" and vice versa. Matched word-by-word (not as one
    // contiguous substring) so word order doesn't matter either — someone
    // typing "press mancuernas" should still find "Press banca con
    // mancuernas" even though "mancuernas" isn't right after "press".
    const tokens = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      query = query.ilike("search_text", `%${token}%`);
    }
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
  if (filters.movementType) {
    query = query.eq("movement_type", filters.movementType);
  }

  const { data } = await query;
  return data ?? [];
}

export async function listFavoriteExerciseIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_favorites")
    .select("exercise_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.exercise_id));
}

export async function getExerciseNote(userId: string, exerciseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_notes")
    .select("note")
    .eq("user_id", userId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();
  return data?.note ?? "";
}

export async function listExercisesByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("id, name, slug, primary_muscle_group_id, muscle_groups(name)")
    .in("id", ids);
  return data ?? [];
}

// Exercise ids used anywhere in a routine's days, to let /exercises put
// "your" exercises first.
export async function listUsedExerciseIds(templateId: string) {
  const supabase = await createClient();
  const { data: days } = await supabase
    .from("workout_template_days")
    .select("id")
    .eq("template_id", templateId);

  const dayIds = (days ?? []).map((d) => d.id);
  if (dayIds.length === 0) return new Set<string>();

  const { data } = await supabase
    .from("workout_template_exercises")
    .select("exercise_id")
    .in("template_day_id", dayIds);

  return new Set((data ?? []).map((r) => r.exercise_id));
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
