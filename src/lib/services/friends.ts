import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface FriendProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
}

export interface Friend extends FriendProfile {
  currentStreak: number;
  lastSession: { name: string; completedAt: string } | null;
}

function calculateStreak(completedAtDates: string[]): number {
  if (completedAtDates.length === 0) return 0;
  const uniqueDays = Array.from(new Set(completedAtDates.map((iso) => iso.slice(0, 10)))).sort(
    (a, b) => (a < b ? 1 : -1),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const mostRecent = new Date(uniqueDays[0]);
  const daysSinceLastWorkout = Math.round((today.getTime() - mostRecent.getTime()) / 86_400_000);
  if (daysSinceLastWorkout > 1) return 0;

  let cursor = new Date(today);
  let streak = 0;
  for (const day of uniqueDays) {
    const cursorIso = cursor.toISOString().slice(0, 10);
    if (day === cursorIso) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0) {
      cursor = new Date(day);
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function listFriends(userId: string): Promise<Friend[]> {
  const supabase = await createClient();
  const { data: friendships } = await supabase
    .from("friendships")
    .select("user_id_a, user_id_b")
    .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);

  const friendIds = (friendships ?? []).map((f) => (f.user_id_a === userId ? f.user_id_b : f.user_id_a));
  if (friendIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, level")
    .in("id", friendIds);

  const friends = await Promise.all(
    (profiles ?? []).map(async (p) => {
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("name, completed_at")
        .eq("user_id", p.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })
        .limit(90);

      const lastSession = sessions?.[0]
        ? { name: sessions[0].name, completedAt: sessions[0].completed_at as string }
        : null;
      const currentStreak = calculateStreak((sessions ?? []).map((s) => s.completed_at as string));

      return {
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        avatarUrl: p.avatar_url,
        level: p.level,
        currentStreak,
        lastSession,
      };
    }),
  );

  return friends;
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
