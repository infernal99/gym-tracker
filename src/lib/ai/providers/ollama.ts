import "server-only";
import type { AIProvider } from "@/lib/ai/provider";
import type { AIChatTurn, AIMessage, AIToolCall, AIToolDefinition } from "@/lib/ai/types";
import { AIProviderUnavailableError } from "@/lib/ai/types";

const BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b-instruct";

// Ollama's OpenAI-compatible endpoint — used instead of its native /api/chat
// so the message/tool-call shape here matches the format most other
// providers speak too, which is what keeps a future provider swap cheap.
const CHAT_URL = `${BASE_URL}/v1/chat/completions`;

type OpenAIToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type OpenAIMessage = {
  role: string;
  content: string | null;
  tool_calls?: OpenAIToolCall[];
};

function toOpenAIMessages(messages: AIMessage[]) {
  return messages.map((m) => {
    if (m.role === "tool") {
      return { role: "tool", content: m.content, tool_call_id: m.toolCallId };
    }
    if (m.toolCalls?.length) {
      return {
        role: m.role,
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

function toOpenAITools(tools: AIToolDefinition[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

function parseToolCalls(toolCalls: OpenAIToolCall[] | undefined): AIToolCall[] {
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
    return { id: tc.id, name: tc.function.name, arguments: args };
  });
}

async function post(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, ...body }),
      signal,
    });
  } catch {
    throw new AIProviderUnavailableError();
  }
  if (!res.ok) {
    throw new AIProviderUnavailableError(`Ollama respondió ${res.status}`);
  }
  return res;
}

export class OllamaProvider implements AIProvider {
  async chat(messages: AIMessage[], tools: AIToolDefinition[]): Promise<AIChatTurn> {
    const res = await post({
      messages: toOpenAIMessages(messages),
      tools: tools.length ? toOpenAITools(tools) : undefined,
      stream: false,
    });
    const data = (await res.json()) as { choices: { message: OpenAIMessage }[] };
    const message = data.choices[0]?.message;
    return {
      content: message?.content ?? "",
      toolCalls: parseToolCalls(message?.tool_calls),
    };
  }

  async *chatStream(messages: AIMessage[]): AsyncGenerator<string, void, unknown> {
    const res = await post({ messages: toOpenAIMessages(messages), stream: true });
    const reader = res.body?.getReader();
    if (!reader) throw new AIProviderUnavailableError();

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

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/api/version`, {
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
