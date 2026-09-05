import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface AIConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface AIStoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export async function listConversations(userId: string): Promise<AIConversationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_conversations")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((c) => ({ id: c.id, title: c.title, updatedAt: c.updated_at }));
}

export async function getConversationMessages(
  conversationId: string,
  userId: string,
): Promise<AIStoredMessage[]> {
  const supabase = await createClient();
  const { data: conversation } = await supabase
    .from("ai_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!conversation) return [];

  const { data } = await supabase
    .from("ai_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.created_at,
  }));
}

export async function createConversation(userId: string, firstMessage: string): Promise<string> {
  const supabase = await createClient();
  const title = firstMessage.trim().slice(0, 60) || "Nueva conversación";
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ user_id: userId, title })
    .select("id")
    .single();
  if (error || !data) throw new Error("No se pudo crear la conversación");
  return data.id;
}

export async function appendMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ai_messages").insert({ conversation_id: conversationId, role, content });
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function deleteConversation(conversationId: string, userId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("ai_conversations").delete().eq("id", conversationId).eq("user_id", userId);
}

export async function renameConversation(
  conversationId: string,
  userId: string,
  title: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("ai_conversations")
    .update({ title: title.trim().slice(0, 60) })
    .eq("id", conversationId)
    .eq("user_id", userId);
}
