import "server-only";
import { createClient } from "@/lib/supabase/server";
import { computeChallengeValue } from "@/lib/services/challenges";
import type { Database } from "@/types/database.types";

type ChallengeMetric = Database["public"]["Enums"]["challenge_metric"];
type ChallengeStatus = Database["public"]["Enums"]["challenge_status"];

export interface GroupChallengeParticipant {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  currentValue: number;
}

export interface GroupChallenge {
  id: string;
  name: string;
  metric: ChallengeMetric;
  exerciseName: string | null;
  targetValue: number;
  startDate: string;
  endDate: string;
  status: ChallengeStatus;
  isCollective: boolean;
  /** Sorted by contribution, highest first — used for the ranking and, for
   *  collective challenges, as "who contributed most" under the shared bar. */
  participants: GroupChallengeParticipant[];
  /** Sum of every participant's value — only meaningful when isCollective. */
  collectiveTotal: number;
}

// Every challenge for this group, each participant's value recomputed live
// from their own session/set data (not persisted back — a viewer who isn't
// the challenge creator can't write another member's row anyway, so this
// avoids the asymmetry of only updating when the right person happens to
// look). "Completed" is derived the same way, live, rather than written.
export async function listGroupChallenges(groupId: string): Promise<GroupChallenge[]> {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("challenges")
    .select(
      `id, name, metric, exercise_id, target_value, start_date, end_date, status, is_collective,
       exercises(name),
       challenge_participants(user_id)`,
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) return [];

  const participantIds = [...new Set(rows.flatMap((r) => r.challenge_participants.map((p) => p.user_id)))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .in("id", participantIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return Promise.all(
    rows.map(async (row): Promise<GroupChallenge> => {
      const values = await Promise.all(
        row.challenge_participants.map(async (p) => ({
          userId: p.user_id,
          value:
            (await computeChallengeValue(supabase, p.user_id, row.metric, row.exercise_id, row.start_date)) ?? 0,
        })),
      );
      const valueByUser = new Map(values.map((v) => [v.userId, v.value]));

      const participants = row.challenge_participants
        .map((p) => {
          const profile = profileById.get(p.user_id);
          if (!profile) return null;
          return {
            id: profile.id,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            currentValue: valueByUser.get(p.user_id) ?? 0,
          };
        })
        .filter((p): p is GroupChallengeParticipant => p !== null)
        .sort((a, b) => b.currentValue - a.currentValue);

      const target = row.target_value ?? 0;
      const collectiveTotal = participants.reduce((sum, p) => sum + p.currentValue, 0);
      const reached = row.is_collective
        ? collectiveTotal >= target
        : participants.some((p) => p.currentValue >= target);

      return {
        id: row.id,
        name: row.name,
        metric: row.metric,
        exerciseName: row.exercises?.name ?? null,
        targetValue: target,
        startDate: row.start_date,
        endDate: row.end_date,
        status: reached ? "completed" : row.status,
        isCollective: row.is_collective,
        participants,
        collectiveTotal,
      };
    }),
  );
}
