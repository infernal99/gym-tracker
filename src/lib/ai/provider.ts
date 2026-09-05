import type { AIChatTurn, AIMessage, AIToolDefinition } from "@/lib/ai/types";

// The only contract the rest of the app depends on. OllamaProvider is the
// one implementation today; a future provider (a hosted API, a different
// local runtime) just implements this same interface and gets swapped in
// at src/lib/ai/service.ts — nothing else changes.
export interface AIProvider {
  /** Non-streaming call used for the tool-calling rounds. */
  chat(messages: AIMessage[], tools: AIToolDefinition[]): Promise<AIChatTurn>;

  /** Streaming call for the final user-facing answer, once no more tools are needed. */
  chatStream(messages: AIMessage[]): AsyncGenerator<string, void, unknown>;

  /** Cheap reachability check — used to show the online/offline state. */
  isAvailable(): Promise<boolean>;
}
