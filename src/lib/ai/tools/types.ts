import type { AIToolDefinition } from "@/lib/ai/types";
import type { AIProposal } from "@/lib/ai/proposals";
import type { AIChart } from "@/lib/ai/charts";

export interface ToolContext {
  userId: string;
}

// A tool result may carry a proposal and/or a chart alongside whatever the
// model sees. The service strips both out before handing the result back
// to the model and surfaces each as its own stream event.
export type ToolResult = Record<string, unknown> & {
  __proposal?: AIProposal;
  __chart?: AIChart;
};

export interface AITool {
  definition: AIToolDefinition;
  execute: (ctx: ToolContext, args: Record<string, unknown>) => Promise<unknown>;
}
