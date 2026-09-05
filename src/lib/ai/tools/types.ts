import type { AIToolDefinition } from "@/lib/ai/types";
import type { AIProposal } from "@/lib/ai/proposals";

export interface ToolContext {
  userId: string;
}

// A tool result may carry a proposal alongside whatever the model sees.
// The service strips __proposal out before handing the result back to the
// model and surfaces it to the UI as its own stream event.
export type ToolResult = Record<string, unknown> & { __proposal?: AIProposal };

export interface AITool {
  definition: AIToolDefinition;
  execute: (ctx: ToolContext, args: Record<string, unknown>) => Promise<unknown>;
}
