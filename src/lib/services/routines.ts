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
