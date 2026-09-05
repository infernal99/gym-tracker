import "server-only";
import type { AIProvider } from "@/lib/ai/provider";
import type { AIChatTurn, AIMessage, AIToolDefinition } from "@/lib/ai/types";
import { AIProviderUnavailableError } from "@/lib/ai/types";
import {
  parseSseContentDeltas,
  parseToolCalls,
  toOpenAIMessages,
  toOpenAITools,
  type OpenAIMessage,
} from "@/lib/ai/providers/openai-compat";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

// Google AI Studio's free tier — tried after Groq's free tier turned out to
// cap this account at 8,000 tokens/minute, too tight for a system prompt
// plus ~14 tool schemas across a multi-round tool-calling turn. Gemini
// exposes an OpenAI-compatible endpoint too, so this reuses the exact same
// message/tool plumbing as the other providers.
const CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;

async function post(body: Record<string, unknown>): Promise<Response> {
  if (!API_KEY) throw new AIProviderUnavailableError("Falta GEMINI_API_KEY");

  let res: Response;
  try {
    res = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, ...body }),
    });
  } catch {
    throw new AIProviderUnavailableError();
  }
  if (res.status === 429) {
    throw new AIProviderUnavailableError("Límite de uso gratuito alcanzado, inténtalo en unos minutos");
  }
  if (!res.ok) {
    throw new AIProviderUnavailableError(`Gemini respondió ${res.status}`);
  }
  return res;
}

export class GeminiProvider implements AIProvider {
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
    yield* parseSseContentDeltas(res, () => {
      throw new AIProviderUnavailableError();
    });
  }

  async isAvailable(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
        { signal: AbortSignal.timeout(3000) },
      );
      return res.ok;
    } catch {
      return false;
    }
  }
}
