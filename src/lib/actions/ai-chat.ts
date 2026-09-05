"use server";

import { requireProfile } from "@/lib/services/profile";
import {
  deleteConversation,
  getConversationMessages,
  type AIStoredMessage,
} from "@/lib/services/ai-chat";

export async function getConversationMessagesAction(
  conversationId: string,
): Promise<AIStoredMessage[]> {
  const profile = await requireProfile();
  return getConversationMessages(conversationId, profile.id);
}

export async function deleteConversationAction(conversationId: string): Promise<void> {
  const profile = await requireProfile();
  await deleteConversation(conversationId, profile.id);
}
