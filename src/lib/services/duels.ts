import "server-only";
import { createClient } from "@/lib/supabase/server";
import { computeChallengeValue } from "@/lib/services/challenges";
import type { DuelMetricOption } from "@/lib/validation/duels";

export interface DuelSide {
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  value: number;
}

export interface Duel {
  id: string;
  name: string;
  metric: DuelMetricOption;
  exerciseName: string | null;
  startDate: string;
  endDate: string;
  me: DuelSide;
  opponent: DuelSide;
  /** Derived from end_date, not the stored status column — see listDuels. */
  finished: boolean;
  iAmWinning: boolean;
}

// Duels reuse `challenges` (is_duel = true) and `challenge_participants` —
// the RLS on those tables was already written to support exactly this
// (a friend can be inserted as a second participant, and any participant
// can read every participant row for a challenge they're in).
//
// One real constraint this works around: RLS only lets you WRITE your own
// participant row and only lets the challenge's creator flip its status.
// So this only recomputes and writes back the CALLER's own current_value
// live; the opponent's figure is whatever it was the last time *they*
// loaded this page. "Finished" is therefore derived from end_date for
// display, rather than trusted from the stored status column, which may
// lag until the creator's own next visit updates it.
export async function listDuels(userId: string): Promise<Duel[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("challenges")
    .select(
      `id, name, metric, exercise_id, start_date, end_date, status, creator_id,
       exercises(name),
       challenge_participants(user_id, current_value, initial_value,
         profiles:user_id(username, display_name, avatar_url))`,
    )
    .eq("is_duel", true)
    .order("created_at", { ascending: false });

  const duels: Duel[] = [];

  for (const row of rows ?? []) {
    const participants = row.challenge_participants ?? [];
    const mine = participants.find((p) => p.user_id === userId);
    const other = participants.find((p) => p.user_id !== userId);
    if (!mine || !other || !other.profiles) continue;

    const computed = await computeChallengeValue(
      supabase,
      userId,
      row.metric,
      row.exercise_id,
      row.start_date,
    );
    const myValue = computed ?? mine.current_value;

    if (computed !== null && computed !== mine.current_value) {
      await supabase
        .from("challenge_participants")
        .update({ current_value: computed })
        .eq("challenge_id", row.id)
        .eq("user_id", userId);
    }

    const finished = new Date(row.end_date) < new Date();
    // Best-effort — only succeeds when the viewer is the creator (RLS), a
    // no-op update otherwise rather than an error either way.
    if (finished && row.status !== "completed" && row.creator_id === userId) {
      await supabase.from("challenges").update({ status: "completed" }).eq("id", row.id);
    }

    duels.push({
      id: row.id,
      name: row.name,
      metric: row.metric as DuelMetricOption,
      exerciseName: row.exercises?.name ?? null,
      startDate: row.start_date,
      endDate: row.end_date,
      me: {
        userId,
        displayName: "Tú",
        username: "",
        avatarUrl: null,
        value: myValue,
      },
      opponent: {
        userId: other.user_id,
        displayName: other.profiles.display_name,
        username: other.profiles.username,
        avatarUrl: other.profiles.avatar_url,
        value: other.current_value,
      },
      finished,
      iAmWinning: myValue >= other.current_value,
    });
  }

  return duels;
}
