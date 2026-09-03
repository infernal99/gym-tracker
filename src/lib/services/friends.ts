import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentStreak, startOfWeek } from "@/lib/date-utils";

export interface FriendProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
}

export interface FriendStats extends FriendProfile {
  isMe: boolean;
  xp: number;
  currentStreak: number;
  volumeThisWeekKg: number;
  workoutsThisWeek: number;
  lastSession: { name: string; completedAt: string } | null;
}

/**
 * The user plus every friend, with all the figures both the friends list and
 * the ranking need. One pass on purpose: the two views want almost the same
 * data, and fetching them separately meant querying friendships and profiles
 * twice and then running one more sessions query *per friend*.
 *
 * 90 days of sessions is what the streak needs anyway, and it comfortably
 * covers the weekly figures too.
 */
export async function getFriendsWithStats(userId: string): Promise<FriendStats[]> {
  const supabase = await createClient();
  const { data: friendships } = await supabase
    .from("friendships")
    .select("user_id_a, user_id_b")
    .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);

  const ids = [
    userId,
    ...(friendships ?? []).map((f) => (f.user_id_a === userId ? f.user_id_b : f.user_id_a)),
  ];

  const since = new Date();
  since.setDate(since.getDate() - 90);

  const [{ data: profiles }, { data: sessions }] = await Promise.all([
    supabase.from("profiles").select("id, username, display_name, avatar_url, level, xp").in("id", ids),
    supabase
      .from("workout_sessions")
      .select("user_id, name, completed_at, total_volume_kg")
      .in("user_id", ids)
      .not("completed_at", "is", null)
      .gte("completed_at", since.toISOString())
      .order("completed_at", { ascending: false }),
  ]);

  const weekStart = startOfWeek(new Date());
  const byUser = new Map<
    string,
    {
      dates: string[];
      volumeThisWeekKg: number;
      workoutsThisWeek: number;
      lastSession: { name: string; completedAt: string } | null;
    }
  >();
  for (const id of ids) {
    byUser.set(id, { dates: [], volumeThisWeekKg: 0, workoutsThisWeek: 0, lastSession: null });
  }

  for (const session of sessions ?? []) {
    const entry = byUser.get(session.user_id);
    if (!entry) continue;
    const completedAt = session.completed_at as string;
    entry.dates.push(completedAt);
    // Sessions come back newest-first, so the first one seen per user is theirs.
    if (!entry.lastSession) entry.lastSession = { name: session.name, completedAt };
    if (new Date(completedAt) >= weekStart) {
      entry.workoutsThisWeek += 1;
      entry.volumeThisWeekKg += Number(session.total_volume_kg ?? 0);
    }
  }

  return (profiles ?? []).map((p) => {
    const entry = byUser.get(p.id)!;
    return {
      id: p.id,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      level: p.level,
      xp: p.xp,
      isMe: p.id === userId,
      currentStreak: currentStreak(entry.dates),
      volumeThisWeekKg: entry.volumeThisWeekKg,
      workoutsThisWeek: entry.workoutsThisWeek,
      lastSession: entry.lastSession,
    };
  });
}

export interface FriendRequest {
  id: string;
  createdAt: string;
  profile: FriendProfile;
}

export async function listIncomingRequests(userId: string): Promise<FriendRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friend_requests")
    .select("id, created_at, sender:profiles!friend_requests_sender_id_fkey(id, username, display_name, avatar_url, level)")
    .eq("receiver_id", userId)
    .eq("status", "pending");

  return (data ?? [])
    .filter((r) => r.sender)
    .map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      profile: {
        id: r.sender!.id,
        username: r.sender!.username,
        displayName: r.sender!.display_name,
        avatarUrl: r.sender!.avatar_url,
        level: r.sender!.level,
      },
    }));
}

export async function listOutgoingRequests(userId: string): Promise<FriendRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("friend_requests")
    .select("id, created_at, receiver:profiles!friend_requests_receiver_id_fkey(id, username, display_name, avatar_url, level)")
    .eq("sender_id", userId)
    .eq("status", "pending");

  return (data ?? [])
    .filter((r) => r.receiver)
    .map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      profile: {
        id: r.receiver!.id,
        username: r.receiver!.username,
        displayName: r.receiver!.display_name,
        avatarUrl: r.receiver!.avatar_url,
        level: r.receiver!.level,
      },
    }));
}
