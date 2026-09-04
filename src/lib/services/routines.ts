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

export interface PendingTemplateShare {
  id: string;
  templateId: string;
  templateName: string;
  shareToken: string;
  sharedBy: { displayName: string; avatarUrl: string | null };
}

// Routines a friend sent this user directly (not the "De serie" library).
export async function listPendingShares(userId: string): Promise<PendingTemplateShare[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("template_shares")
    .select(
      "id, template_id, share_token, workout_templates(name), sharer:profiles!template_shares_shared_by_fkey(display_name, avatar_url)",
    )
    .eq("shared_with", userId)
    .order("created_at", { ascending: false });

  return (data ?? [])
    .filter((s) => s.workout_templates && s.sharer)
    .map((s) => ({
      id: s.id,
      templateId: s.template_id,
      templateName: s.workout_templates!.name,
      shareToken: s.share_token,
      sharedBy: { displayName: s.sharer!.display_name, avatarUrl: s.sharer!.avatar_url },
    }));
}

// Friends this template hasn't already been shared with — mirrors how
// InviteFriendDialog only offers group non-members.
export async function listShareCandidates(userId: string, templateId: string) {
  const supabase = await createClient();
  const [{ data: friendships }, { data: alreadyShared }] = await Promise.all([
    supabase
      .from("friendships")
      .select("user_id_a, user_id_b")
      .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`),
    supabase.from("template_shares").select("shared_with").eq("template_id", templateId),
  ]);

  const friendIds = (friendships ?? []).map((f) => (f.user_id_a === userId ? f.user_id_b : f.user_id_a));
  const sharedWithIds = new Set((alreadyShared ?? []).map((s) => s.shared_with));
  const candidateIds = friendIds.filter((id) => !sharedWithIds.has(id));
  if (candidateIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", candidateIds);

  return (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
  }));
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
