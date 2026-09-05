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

const API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-20b";
const CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq's free tier caps this account at 8,000 tokens/minute regardless of
// which tool-capable model is used — tight, given our system prompt plus
// ~14 tool schemas plus a multi-round tool-calling turn can add up fast.
// gpt-oss models emit a separate hidden "reasoning" pass before answering;
// reasoning_effort:"low" cuts that from dozens of tokens to single digits,
// which is what makes a multi-tool-round turn fit in the free budget at all.
const REASONING_EFFORT = "low";

// Groq's free tier — used so Gym Tracker AI also answers from the deployed
// app (Vercel can't reach a model running on someone's home PC). Local dev
// keeps using Ollama; src/lib/ai/service.ts picks this provider only when
// GROQ_API_KEY is set, which in practice means "in production only".
async function post(body: Record<string, unknown>): Promise<Response> {
  if (!API_KEY) throw new AIProviderUnavailableError("Falta GROQ_API_KEY");

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
    throw new AIProviderUnavailableError(`Groq respondió ${res.status}`);
  }
  return res;
}

export class GroqProvider implements AIProvider {
  async chat(messages: AIMessage[], tools: AIToolDefinition[]): Promise<AIChatTurn> {
    const res = await post({
      messages: toOpenAIMessages(messages),
      tools: tools.length ? toOpenAITools(tools) : undefined,
      reasoning_effort: REASONING_EFFORT,
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
    const res = await post({
      messages: toOpenAIMessages(messages),
      reasoning_effort: REASONING_EFFORT,
      stream: true,
    });
    yield* parseSseContentDeltas(res, () => {
      throw new AIProviderUnavailableError();
    });
  }

  async isAvailable(): Promise<boolean> {
    if (!API_KEY) return false;
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${API_KEY}` },
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
