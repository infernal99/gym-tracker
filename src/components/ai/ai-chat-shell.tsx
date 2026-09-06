"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChatMessage } from "@/components/ai/chat-message";
import { AIMascotAvatar } from "@/components/ai/ai-mascot-avatar";
import { ChatInput } from "@/components/ai/chat-input";
import { AISuggestions } from "@/components/ai/ai-suggestions";
import { AIStatusBadge } from "@/components/ai/ai-status-badge";
import { ConversationHistory } from "@/components/ai/conversation-history";
import { ProposalCard } from "@/components/ai/proposal-card";
import { ExerciseProgressChartCard } from "@/components/ai/exercise-progress-chart-card";
import {
  getConversationMessagesAction,
  deleteConversationAction,
} from "@/lib/actions/ai-chat";
import type { AIConversationSummary, AIStoredMessage } from "@/lib/services/ai-chat";
import type { AIProposal } from "@/lib/ai/proposals";
import type { AIChart } from "@/lib/ai/charts";

type ChatMessageState = {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposal?: AIProposal;
  chart?: AIChart;
};

const STATUS_POLL_MS = 20_000;

function toMessageState(messages: AIStoredMessage[]): ChatMessageState[] {
  return messages.map((m) => ({ id: m.id, role: m.role, content: m.content }));
}

export function AIChatShell({
  initialConversations,
  initialConversationId,
  initialMessages,
}: {
  initialConversations: AIConversationSummary[];
  initialConversationId: string | null;
  initialMessages: AIStoredMessage[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<ChatMessageState[]>(toMessageState(initialMessages));
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean | null>(null);
  const [usage, setUsage] = useState<{ usedToday: number; dailyLimit: number } | null>(null);
  const limitReached = Boolean(usage && usage.usedToday >= usage.dailyLimit);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/ai/status", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setAiAvailable(Boolean(data.available));
        if (typeof data.usedToday === "number" && typeof data.dailyLimit === "number") {
          setUsage({ usedToday: data.usedToday, dailyLimit: data.dailyLimit });
        }
      } catch {
        if (!cancelled) setAiAvailable(false);
      }
    }
    poll();
    const interval = setInterval(poll, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Refreshed right after each message too, so the counter in the header
  // updates immediately instead of waiting for the next background poll.
  async function refreshUsage() {
    try {
      const res = await fetch("/api/ai/status", { cache: "no-store" });
      const data = await res.json();
      if (typeof data.usedToday === "number" && typeof data.dailyLimit === "number") {
        setUsage({ usedToday: data.usedToday, dailyLimit: data.dailyLimit });
      }
    } catch {
      // Best-effort — the next background poll will pick it up.
    }
  }

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, statusText]);

  async function loadConversation(id: string) {
    setConversationId(id);
    setStatusText(null);
    const stored = await getConversationMessagesAction(id);
    setMessages(toMessageState(stored));
  }

  function startNewConversation() {
    setConversationId(null);
    setMessages([]);
    setStatusText(null);
  }

  async function removeConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === conversationId) startNewConversation();
    await deleteConversationAction(id);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming || limitReached) return;

    const isFirstMessage = messages.length === 0;
    setInput("");
    setStatusText(null);
    setStreaming(true);
    setMessages((prev) => [
      ...prev,
      { id: `local-user-${Date.now()}`, role: "user", content: trimmed },
      { id: `local-assistant-${Date.now()}`, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        setMessages((prev) => setLastAssistant(prev, text || "Gym Tracker AI no está disponible en este momento."));
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as
            | { type: "conversation"; conversationId: string }
            | { type: "status"; text: string }
            | { type: "token"; text: string }
            | { type: "proposal"; proposal: AIProposal }
            | { type: "chart"; chart: AIChart }
            | { type: "error"; text: string }
            | { type: "done" };

          if (event.type === "conversation") {
            if (isFirstMessage) {
              setConversationId(event.conversationId);
              setConversations((prev) => [
                { id: event.conversationId, title: trimmed.slice(0, 60), updatedAt: new Date().toISOString() },
                ...prev,
              ]);
            }
          } else if (event.type === "status") {
            setStatusText(event.text);
          } else if (event.type === "token") {
            setStatusText(null);
            setMessages((prev) => appendToLastAssistant(prev, event.text));
          } else if (event.type === "proposal") {
            setMessages((prev) => attachProposalToLastAssistant(prev, event.proposal));
          } else if (event.type === "chart") {
            setMessages((prev) => attachChartToLastAssistant(prev, event.chart));
          } else if (event.type === "error") {
            setStatusText(null);
            setMessages((prev) => setLastAssistant(prev, event.text));
          }
        }
      }
    } catch {
      setMessages((prev) =>
        setLastAssistant(prev, "Gym Tracker AI no está disponible en este momento."),
      );
    } finally {
      setStreaming(false);
      setStatusText(null);
      refreshUsage();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b py-3">
        <div className="flex items-center gap-2">
          <AIMascotAvatar size={36} />
          <div>
            <p className="text-sm font-semibold leading-none">Gym Tracker AI</p>
            <AIStatusBadge available={aiAvailable} usage={usage} />
          </div>
        </div>
        <ConversationHistory
          conversations={conversations}
          activeId={conversationId}
          onSelect={loadConversation}
          onNew={startNewConversation}
          onDelete={removeConversation}
        />
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
        {messages.length === 0 && (
          <div className="space-y-4 py-4 text-center">
            <Image
              src="/mascot/gym-buddy-full.png"
              alt=""
              width={160}
              height={296}
              className="mx-auto h-40 w-auto"
              priority
            />
            <p className="text-sm text-muted-foreground">
              Pregúntame lo que quieras sobre tu entrenamiento, tu progreso o tus rutinas.
            </p>
            {!limitReached && <AISuggestions onPick={sendMessage} />}
          </div>
        )}

        {messages.map((m, i) => {
          const isLastAssistant = m.role === "assistant" && i === messages.length - 1;
          return (
            <div key={m.id} className="space-y-3">
              <ChatMessage
                role={m.role}
                content={m.content}
                pending={isLastAssistant && streaming && !statusText && !m.content}
              />
              {m.proposal && <ProposalCard proposal={m.proposal} />}
              {m.chart && <ExerciseProgressChartCard chart={m.chart} />}
            </div>
          );
        })}

        {statusText && (
          <div className="flex items-center gap-2 pl-9 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            {statusText}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="shrink-0">
        {limitReached ? (
          <p className="border-t py-3 text-center text-xs text-muted-foreground">
            Has usado tus {usage?.dailyLimit} mensajes gratuitos de hoy. Vuelve mañana.
          </p>
        ) : (
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
            disabled={streaming}
          />
        )}
      </div>
    </div>
  );
}

function appendToLastAssistant(messages: ChatMessageState[], chunk: string): ChatMessageState[] {
  const next = [...messages];
  const lastIndex = next.length - 1;
  if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
    next[lastIndex] = { ...next[lastIndex], content: next[lastIndex].content + chunk };
  }
  return next;
}

function attachProposalToLastAssistant(
  messages: ChatMessageState[],
  proposal: AIProposal,
): ChatMessageState[] {
  const next = [...messages];
  const lastIndex = next.length - 1;
  if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
    next[lastIndex] = { ...next[lastIndex], proposal };
  }
  return next;
}

function attachChartToLastAssistant(
  messages: ChatMessageState[],
  chart: AIChart,
): ChatMessageState[] {
  const next = [...messages];
  const lastIndex = next.length - 1;
  if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
    next[lastIndex] = { ...next[lastIndex], chart };
  }
  return next;
}

function setLastAssistant(messages: ChatMessageState[], content: string): ChatMessageState[] {
  const next = [...messages];
  const lastIndex = next.length - 1;
  if (lastIndex >= 0 && next[lastIndex].role === "assistant") {
    next[lastIndex] = { ...next[lastIndex], content };
  }
  return next;
}
