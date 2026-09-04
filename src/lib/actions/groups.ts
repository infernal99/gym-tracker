"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { createGroupSchema } from "@/lib/validation/groups";
import { createGroupChallengeSchema } from "@/lib/validation/group-challenges";

export async function createGroupAction(formData: FormData) {
  const parsed = createGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) return;

  const profile = await requireProfile();
  const supabase = await createClient();

  // The id is generated here rather than left to the database default and
  // read back via .select(): right after the groups row exists there is no
  // group_members row for it yet, so the SELECT half of RLS (which every
  // INSERT ... RETURNING is re-checked against) would see zero members and
  // refuse to return the row the insert itself just created. Knowing the id
  // upfront means the insert can skip RETURNING entirely.
  const groupId = crypto.randomUUID();
  const { error } = await supabase.from("groups").insert({
    id: groupId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    creator_id: profile.id,
  });
  if (error) return;

  // Not a trigger — inserted here so it goes through the ordinary
  // "creator adds themselves as owner" branch of group_members_insert,
  // the same one a client-side retry would use.
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({ group_id: groupId, user_id: profile.id, role: "owner" });
  if (memberError) {
    await supabase.from("groups").delete().eq("id", groupId);
    return;
  }

  revalidatePath("/groups");
  redirect(`/groups/${groupId}`);
}

export async function inviteFriendAction(groupId: string, friendId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("group_members").insert({ group_id: groupId, user_id: friendId, role: "member" });
  revalidatePath(`/groups/${groupId}`);
}

export async function removeMemberAction(groupId: string, memberId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", memberId);
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroupAction(groupId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", profile.id);
  redirect("/groups");
}

export async function updateSharingSettingsAction(groupId: string, formData: FormData): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("group_members")
    .update({
      share_workouts: formData.get("shareWorkouts") === "on",
      share_prs: formData.get("sharePrs") === "on",
      share_streak: formData.get("shareStreak") === "on",
    })
    .eq("group_id", groupId)
    .eq("user_id", profile.id);
  revalidatePath(`/groups/${groupId}`);
}

export async function createGroupChallengeAction(groupId: string, formData: FormData) {
  const parsed = createGroupChallengeSchema.safeParse({
    metric: formData.get("metric"),
    name: formData.get("name"),
    exerciseId: formData.get("exerciseId") || "",
    targetValue: formData.get("targetValue"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    isCollective: formData.get("isCollective") === "on",
  });
  if (!parsed.success) return;

  const d = parsed.data;
  if (d.endDate <= d.startDate) return;
  if (d.metric === "exercise" && !d.exerciseId) return;

  const profile = await requireProfile();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const status = d.startDate <= today ? "active" : "upcoming";
  const challengeId = crypto.randomUUID();

  // Same id-generated-client-side, no-RETURNING shape as createGroupAction —
  // this row isn't visible via challenges_select (is_challenge_participant)
  // until a challenge_participants row exists for the creator, which is the
  // very next statement.
  const { error } = await supabase.from("challenges").insert({
    id: challengeId,
    creator_id: profile.id,
    group_id: groupId,
    is_collective: d.isCollective,
    name: d.name,
    metric: d.metric,
    exercise_id: d.metric === "exercise" ? d.exerciseId || null : null,
    target_value: d.targetValue,
    start_date: d.startDate,
    end_date: d.endDate,
    status,
  });
  if (error) return;

  // Every current group member joins automatically — a group challenge
  // with an opt-in step would need its own invite/accept flow, and the
  // spec's examples ("Participantes: Ian, Alex, Marc, Pau") show the whole
  // group entered from the start. challenge_participants_insert already
  // lets a challenge's creator add any user_id to their own challenge, with
  // no separate friendship check, so this doesn't need an RLS change.
  const { data: members } = await supabase.from("group_members").select("user_id").eq("group_id", groupId);
  if (members && members.length > 0) {
    await supabase.from("challenge_participants").insert(
      members.map((m) => ({
        challenge_id: challengeId,
        user_id: m.user_id,
        initial_value: 0,
        current_value: 0,
      })),
    );
  }

  revalidatePath(`/groups/${groupId}`);
}
