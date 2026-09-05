import { requireProfile } from "@/lib/services/profile";
import { listConversations, getConversationMessages } from "@/lib/services/ai-chat";
import { AIChatShell } from "@/components/ai/ai-chat-shell";

export default async function AIPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const profile = await requireProfile();
  const { c: conversationId } = await searchParams;

  const [conversations, initialMessages] = await Promise.all([
    listConversations(profile.id),
    conversationId ? getConversationMessages(conversationId, profile.id) : Promise.resolve([]),
  ]);

  return (
    <div className="-mx-4 -my-6 h-[calc(100%+3rem)] px-4">
      <AIChatShell
        initialConversations={conversations}
        initialConversationId={conversationId ?? null}
        initialMessages={initialMessages}
      />
    </div>
  );
}
