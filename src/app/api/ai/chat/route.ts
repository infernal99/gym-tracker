import { createClient } from "@/lib/supabase/server";
import { runAIChat } from "@/lib/ai/service";
import { DAILY_MESSAGE_LIMIT } from "@/lib/ai/limits";
import {
  appendMessage,
  countMessagesToday,
  createConversation,
  getConversationMessages,
} from "@/lib/services/ai-chat";
import type { AIMessage } from "@/lib/ai/types";

const MAX_MESSAGE_LENGTH = 2000;

// A short in-memory burst guard on top of the DB-backed daily limit below —
// catches a runaway client loop within one warm server instance. It resets
// on cold start / a new instance, which is exactly why the real limit (one
// person can't use up the whole day's shared free quota and lock everyone
// else out) lives in the database instead, counted from messages already
// being persisted.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const requestLog = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  if (isRateLimited(user.id)) {
    return new Response("Demasiados mensajes, espera un momento.", { status: 429 });
  }

  const usedToday = await countMessagesToday(user.id);
  if (usedToday >= DAILY_MESSAGE_LIMIT) {
    return new Response(
      `Has usado tus ${DAILY_MESSAGE_LIMIT} mensajes gratuitos de hoy con Gym Tracker AI. Vuelve mañana para seguir usándolo.`,
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const conversationId = typeof body?.conversationId === "string" ? body.conversationId : null;

  if (!message) return new Response("Falta el mensaje", { status: 400 });
  if (message.length > MAX_MESSAGE_LENGTH) {
    return new Response("El mensaje es demasiado largo", { status: 400 });
  }

  const activeConversationId = conversationId ?? (await createConversation(user.id, message));
  const priorMessages = conversationId
    ? await getConversationMessages(conversationId, user.id)
    : [];

  await appendMessage(activeConversationId, "user", message);

  const history: AIMessage[] = [
    ...priorMessages.map((m) => ({ role: m.role, content: m.content }) as AIMessage),
    { role: "user", content: message },
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      send({ type: "conversation", conversationId: activeConversationId });

      const generator = runAIChat(user.id, history);
      let result = await generator.next();
      while (!result.done) {
        send(result.value);
        result = await generator.next();
      }

      const fullText = result.value;
      if (fullText) {
        await appendMessage(activeConversationId, "assistant", fullText);
      }
      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
  });
}
