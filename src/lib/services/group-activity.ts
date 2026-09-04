import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

type ActivityType = Database["public"]["Enums"]["activity_type"];

export interface GroupActivityEntry {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  type: ActivityType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Recent events from this group's members, whichever ones each member has
// chosen to share (RLS does the actual filtering — new_pr against
// share_prs, everything else against share_workouts — so a row only
// reaches here if the member who logged it agreed to show it).
export async function listGroupActivity(groupId: string, limit = 30): Promise<GroupActivityEntry[]> {
  const supabase = await createClient();
  const { data: members } = await supabase.from("group_members").select("user_id").eq("group_id", groupId);
  const memberIds = (members ?? []).map((m) => m.user_id);
  if (memberIds.length === 0) return [];

  const [{ data: rows }, { data: profiles }] = await Promise.all([
    supabase
      .from("activity_feed")
      .select("id, user_id, type, metadata, created_at")
      .in("user_id", memberIds)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", memberIds),
  ]);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (rows ?? [])
    .map((row) => {
      const profile = profileById.get(row.user_id);
      if (!profile) return null;
      return {
        id: row.id,
        userId: row.user_id,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        type: row.type,
        metadata: (row.metadata as Record<string, unknown>) ?? {},
        createdAt: row.created_at,
      };
    })
    .filter((e): e is GroupActivityEntry => e !== null);
}
