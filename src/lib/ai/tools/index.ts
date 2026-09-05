import { READ_TOOLS } from "@/lib/ai/tools/read-tools";
import { WRITE_TOOLS } from "@/lib/ai/tools/write-tools";
import type { AITool } from "@/lib/ai/tools/types";

export const ALL_TOOLS: AITool[] = [...READ_TOOLS, ...WRITE_TOOLS];

export type { AITool, ToolContext } from "@/lib/ai/tools/types";
