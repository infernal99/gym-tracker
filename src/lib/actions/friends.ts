"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/services/profile";
import { usernameSearchSchema } from "@/lib/validation/friends";
import type { ActionResult } from "@/lib/actions/auth";
import type { FriendProfile } from "@/lib/services/friends";

export type SearchResult = ActionResult & { profile?: FriendProfile };

export async function searchUserByUsernameAction(
  _prev: SearchResult,
  formData: FormData,
): Promise<SearchResult> {
  const parsed = usernameSearchSchema.safeParse({ username: formData.get("username") });
  if (!parsed.success) {
    return { error: "Username no válido" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("find_user_by_username", {
    p_username: parsed.data.username,
  });

  if (error) return { error: "Error al buscar" };
  if (!data || data.length === 0) return { error: "No se encontró ese usuario" };

  const found = data[0];
  return {
    error: null,
    profile: {
      id: found.id,
      username: found.username,
      displayName: found.display_name,
      avatarUrl: found.avatar_url,
      level: found.level,
    },
  };
}

export async function sendFriendRequestAction(receiverId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase.from("friend_requests").insert({
    sender_id: profile.id,
    receiver_id: receiverId,
  });

  revalidatePath("/friends");
}

export async function respondFriendRequestAction(
  requestId: string,
  accept: boolean,
): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("friend_requests")
    .update({ status: accept ? "accepted" : "rejected", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("receiver_id", profile.id);

  revalidatePath("/friends");
}

export async function cancelFriendRequestAction(requestId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("friend_requests")
    .update({ status: "cancelled", responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("sender_id", profile.id);

  revalidatePath("/friends");
}

export async function removeFriendAction(friendId: string): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id_a.eq.${profile.id},user_id_b.eq.${friendId}),and(user_id_a.eq.${friendId},user_id_b.eq.${profile.id})`,
    );

  revalidatePath("/friends");
}
