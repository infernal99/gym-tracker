// Shared types for the AI layer. Nothing here knows about Ollama
// specifically — that's the point: swapping providers later only means
// writing a new file under providers/ that implements AIProvider.

export type AIRole = "system" | "user" | "assistant" | "tool";

export interface AIMessage {
  role: AIRole;
  content: string;
  toolCallId?: string;
  toolCalls?: AIToolCall[];
}

export interface AIToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  // The provider's own wire-format object for this call, if it has one
  // (e.g. Gemini attaches a thought_signature that must round-trip back
  // unchanged on the next turn or it rejects the request). Providers that
  // don't need this just ignore it.
  raw?: unknown;
}

export interface AIToolParameterSchema {
  type: "object";
  properties: Record<string, { type: string; description: string; enum?: string[] }>;
  required?: string[];
}

export interface AIToolDefinition {
  name: string;
  description: string;
  parameters: AIToolParameterSchema;
}

// What the model returned for one turn: either it wants to call tools, or
// it produced a final answer.
export interface AIChatTurn {
  content: string;
  toolCalls: AIToolCall[];
}

export class AIProviderUnavailableError extends Error {
  constructor(message = "El proveedor de IA no está disponible") {
    super(message);
    this.name = "AIProviderUnavailableError";
  }
}
