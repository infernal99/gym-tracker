import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface MilestoneNotification {
  id: string;
  title: string;
  body: string | null;
  relatedId: string | null;
  exerciseSlug: string | null;
  createdAt: string;
}

export async function listUnreadMilestones(userId: string): Promise<MilestoneNotification[]> {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, body, related_id, created_at")
    .eq("user_id", userId)
    .eq("type", "milestone")
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  const exerciseIds = (notifications ?? [])
    .map((n) => n.related_id)
    .filter((id): id is string => !!id);

  const slugById = new Map<string, string>();
  if (exerciseIds.length > 0) {
    const { data: exercises } = await supabase
      .from("exercises")
      .select("id, slug")
      .in("id", exerciseIds);
    for (const e of exercises ?? []) slugById.set(e.id, e.slug);
  }

  return (notifications ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    relatedId: n.related_id,
    exerciseSlug: n.related_id ? (slugById.get(n.related_id) ?? null) : null,
    createdAt: n.created_at,
  }));
}
