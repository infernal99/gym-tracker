import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listMyTemplates(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select("*, workout_template_days(id)")
    .eq("user_id", userId)
    .order("is_archived")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listPublicTemplates() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select("*, workout_template_days(id, name)")
    .eq("is_public", true)
    .order("name");
  return data ?? [];
}

// Whether the viewer already has their own personal copy of a public
// template, so "Personalizar" can jump straight to it instead of forking
// a second time.
export async function findUserFork(userId: string, forkedFromId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("user_id", userId)
    .eq("forked_from_id", forkedFromId)
    .maybeSingle();
  return data;
}

export async function getTemplate(templateId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_templates")
    .select(
      `*, workout_template_days(
        *, workout_template_exercises(
          *, exercises(id, name, slug, primary_muscle_group_id, muscle_groups(name))
        )
      )`,
    )
    .eq("id", templateId)
    .single();
  return data;
}

export interface WeekdaySlot {
  weekday: number;
  dayId: string;
  dayName: string;
  isRestDay: boolean;
}

export async function listWeekdaySlots(templateId: string): Promise<WeekdaySlot[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workout_template_weekday_slots")
    .select("weekday, workout_template_days(id, name, is_rest_day)")
    .eq("template_id", templateId);

  return (data ?? [])
    .filter((row) => row.workout_template_days)
    .map((row) => ({
      weekday: row.weekday,
      dayId: row.workout_template_days!.id,
      dayName: row.workout_template_days!.name,
      isRestDay: row.workout_template_days!.is_rest_day,
    }));
}
