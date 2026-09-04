import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentStreak, longestStreak, startOfWeek } from "@/lib/date-utils";

export interface GroupSummary {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  memberCount: number;
  role: "owner" | "member";
}

// Groups the user belongs to, each with a member count. RLS already limits
// this to groups the caller is a member of, so no extra filtering is needed
// here — the query would just return nothing for anything else.
export async function listMyGroups(userId: string): Promise<GroupSummary[]> {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from("group_members")
    .select("role, groups(id, name, description, avatar_url)")
    .eq("user_id", userId);

  const groups = (memberships ?? []).filter((m) => m.groups);
  if (groups.length === 0) return [];

  const groupIds = groups.map((m) => m.groups!.id);
  const { data: allMembers } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  const counts = new Map<string, number>();
  for (const m of allMembers ?? []) counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);

  return groups.map((m) => ({
    id: m.groups!.id,
    name: m.groups!.name,
    description: m.groups!.description,
    avatarUrl: m.groups!.avatar_url,
    memberCount: counts.get(m.groups!.id) ?? 1,
    role: m.role,
  }));
}

export interface GroupMemberStats {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  isMe: boolean;
  role: "owner" | "member";
  sharing: { workouts: boolean; prs: boolean; streak: boolean };
  /** null when this member has that figure hidden (and it isn't the viewer). */
  workoutsThisWeek: number | null;
  volumeThisWeekKg: number | null;
  prsThisWeek: number | null;
  currentStreak: number | null;
  longestStreak: number | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  creatorId: string;
  viewerRole: "owner" | "member";
  members: GroupMemberStats[];
}

// Everything the group page needs in one go: the group itself, every
// member's profile, and the figures the ranking sorts by — each gated by
// that member's own sharing switches, except for the viewer's own row,
// which always shows in full (a switch only affects what *others* see).
export async function getGroupDetail(groupId: string, viewerId: string): Promise<GroupDetail | null> {
  const supabase = await createClient();

  const [{ data: group }, { data: members }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
    supabase
      .from("group_members")
      .select("user_id, role, share_workouts, share_prs, share_streak, joined_at")
      .eq("group_id", groupId),
  ]);
  if (!group || !members || members.length === 0) return null;

  const viewerMembership = members.find((m) => m.user_id === viewerId);
  if (!viewerMembership) return null; // not a member — RLS would've hidden `group` anyway

  const memberIds = members.map((m) => m.user_id);
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const weekStart = startOfWeek(new Date());

  const [{ data: profiles }, { data: sessions }, { data: prs }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url, level").in("id", memberIds),
    supabase
      .from("workout_sessions")
      .select("user_id, completed_at, total_volume_kg")
      .in("user_id", memberIds)
      .not("completed_at", "is", null)
      .gte("completed_at", since.toISOString()),
    supabase
      .from("personal_records")
      .select("user_id, achieved_at")
      .in("user_id", memberIds)
      .gte("achieved_at", weekStart.toISOString()),
  ]);

  const byUser = new Map<
    string,
    { dates: string[]; workoutsThisWeek: number; volumeThisWeekKg: number; prsThisWeek: number }
  >();
  for (const id of memberIds) byUser.set(id, { dates: [], workoutsThisWeek: 0, volumeThisWeekKg: 0, prsThisWeek: 0 });

  for (const session of sessions ?? []) {
    const entry = byUser.get(session.user_id);
    if (!entry) continue;
    const completedAt = session.completed_at as string;
    entry.dates.push(completedAt);
    if (new Date(completedAt) >= weekStart) {
      entry.workoutsThisWeek += 1;
      entry.volumeThisWeekKg += Number(session.total_volume_kg ?? 0);
    }
  }
  for (const pr of prs ?? []) {
    const entry = byUser.get(pr.user_id);
    if (entry) entry.prsThisWeek += 1;
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const memberStats: GroupMemberStats[] = members
    .map((m) => {
      const profile = profileById.get(m.user_id);
      if (!profile) return null;
      const isMe = m.user_id === viewerId;
      const stats = byUser.get(m.user_id)!;
      const showWorkouts = isMe || m.share_workouts;
      const showPrs = isMe || m.share_prs;
      // Streak is derived from the same session rows workouts/volume come
      // from — RLS only exposes those rows at all when share_workouts is
      // on, so a streak can never be visible without it regardless of this
      // member's own share_streak choice. share_streak only narrows
      // further (hide the streak specifically while keeping counts/volume).
      const showStreak = isMe || (m.share_workouts && m.share_streak);

      return {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
        level: profile.level,
        isMe,
        role: m.role,
        sharing: { workouts: m.share_workouts, prs: m.share_prs, streak: m.share_streak },
        workoutsThisWeek: showWorkouts ? stats.workoutsThisWeek : null,
        volumeThisWeekKg: showWorkouts ? stats.volumeThisWeekKg : null,
        prsThisWeek: showPrs ? stats.prsThisWeek : null,
        currentStreak: showStreak ? currentStreak(stats.dates) : null,
        longestStreak: showStreak ? longestStreak(stats.dates) : null,
      };
    })
    .filter((m): m is GroupMemberStats => m !== null)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "owner" ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    avatarUrl: group.avatar_url,
    creatorId: group.creator_id,
    viewerRole: viewerMembership.role,
    members: memberStats,
  };
}

export interface InviteCandidate {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

// Friends not already in the group — the only people an owner is allowed to
// add, per the group_members_insert policy.
export async function listInviteCandidates(groupId: string, userId: string): Promise<InviteCandidate[]> {
  const supabase = await createClient();
  const [{ data: friendships }, { data: existingMembers }] = await Promise.all([
    supabase.from("friendships").select("user_id_a, user_id_b").or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`),
    supabase.from("group_members").select("user_id").eq("group_id", groupId),
  ]);

  const memberIds = new Set((existingMembers ?? []).map((m) => m.user_id));
  const friendIds = (friendships ?? [])
    .map((f) => (f.user_id_a === userId ? f.user_id_b : f.user_id_a))
    .filter((id) => !memberIds.has(id));
  if (friendIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .in("id", friendIds);

  return (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
  }));
}
