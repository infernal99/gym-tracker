import "server-only";
import type { AIMessage, AIToolCall, AIToolDefinition } from "@/lib/ai/types";

// Shared shape/parsing for any provider that speaks the OpenAI chat-
// completions format (Ollama, Groq, and most others) — every provider using
// this only differs in base URL, auth header and model name.

export type OpenAIToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type OpenAIMessage = {
  role: string;
  content: string | null;
  tool_calls?: OpenAIToolCall[];
};

export function toOpenAIMessages(messages: AIMessage[]) {
  return messages.map((m) => {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
    }
    if (m.toolCalls?.length) {
      return {
        role: m.role,
        content: m.content || null,
        // Echo back the provider's own object when we have one — Gemini
        // attaches a thought_signature to each call that must round-trip
        // unchanged, and there's no generic way to reconstruct that field.
        tool_calls: m.toolCalls.map(
          (tc) =>
            tc.raw ?? {
              id: tc.id,
              type: "function" as const,
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
            },
        ),
      };
    }
    return { role: m.role, content: m.content };
  });
}

export function toOpenAITools(tools: AIToolDefinition[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

export function parseToolCalls(toolCalls: OpenAIToolCall[] | undefined): AIToolCall[] {
  if (!toolCalls) return [];
  return toolCalls.map((tc) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.function.arguments || "{}");
    } catch {
      // A malformed arguments string just means the tool gets no args —
      // the tool executor validates and reports back to the model instead
      // of the request crashing.
    }
    return { id: tc.id, name: tc.function.name, arguments: args, raw: tc };
  });
}

export async function* parseSseContentDeltas(
  res: Response,
  onUnavailable: () => never,
): AsyncGenerator<string, void, unknown> {
  const reader = res.body?.getReader();
  if (!reader) onUnavailable();

  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta as string;
      } catch {
        // Ignore a stray non-JSON keep-alive line.
      }
    }
  }
}
