import "server-only";
import { OllamaProvider } from "@/lib/ai/providers/ollama";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { READ_TOOLS } from "@/lib/ai/tools/read-tools";
import type { AIMessage } from "@/lib/ai/types";
import type { AIProvider } from "@/lib/ai/provider";

// Swapping providers later means changing this one line (or reading an env
// var to pick a class) — nothing downstream references Ollama directly.
const provider: AIProvider = new OllamaProvider();

const MAX_TOOL_ROUNDS = 4;

const TOOL_STATUS_TEXT: Record<string, string> = {
  get_user_profile: "Consultando tu perfil...",
  get_active_routine: "Consultando tu rutina...",
  get_workout_history: "Consultando tu historial...",
  get_last_workout_detail: "Consultando tu entrenamiento...",
  get_exercise_progress: "Analizando tu progreso...",
  get_personal_records: "Consultando tus récords...",
  get_body_weight_history: "Consultando tu peso corporal...",
  get_goals: "Consultando tus objetivos...",
  get_training_statistics: "Analizando tus estadísticas...",
  find_exercises: "Buscando ejercicios...",
};

export type AIStreamEvent =
  | { type: "status"; text: string }
  | { type: "token"; text: string }
  | { type: "error"; text: string };

export async function checkAIAvailable(): Promise<boolean> {
  return provider.isAvailable();
}

// One assistant turn: runs the read-tool loop, then yields the final answer
// in small chunks so the UI can render it progressively. Returns the full
// text at the end so the caller can persist it.
export async function* runAIChat(
  userId: string,
  history: AIMessage[],
): AsyncGenerator<AIStreamEvent, string, unknown> {
  const messages: AIMessage[] = [{ role: "system", content: buildSystemPrompt() }, ...history];
  const toolDefinitions = READ_TOOLS.map((t) => t.definition);
  const toolsByName = new Map(READ_TOOLS.map((t) => [t.definition.name, t]));

  let finalContent = "";

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const turn = await provider.chat(messages, toolDefinitions);

      if (turn.toolCalls.length === 0) {
        finalContent = turn.content;
        break;
      }

      messages.push({ role: "assistant", content: turn.content, toolCalls: turn.toolCalls });

      for (const call of turn.toolCalls) {
        const tool = toolsByName.get(call.name);
        const statusText = TOOL_STATUS_TEXT[call.name] ?? "Consultando tus datos...";
        yield { type: "status", text: statusText };

        let resultPayload: unknown;
        if (!tool) {
          resultPayload = { error: `Herramienta desconocida: ${call.name}` };
        } else {
          try {
            resultPayload = await tool.execute({ userId }, call.arguments);
          } catch {
            resultPayload = { error: "No se pudo obtener el dato en este momento." };
          }
        }

        messages.push({
          role: "tool",
          toolCallId: call.id,
          content: JSON.stringify(resultPayload),
        });
      }

      if (round === MAX_TOOL_ROUNDS - 1) {
        // Ran out of rounds — ask for a final answer with no more tools offered.
        const closing = await provider.chat(messages, []);
        finalContent = closing.content;
      }
    }
  } catch {
    yield {
      type: "error",
      text: "Gym Tracker AI no está disponible en este momento.",
    };
    return "";
  }

  if (!finalContent) {
    finalContent = "No he podido generar una respuesta. Inténtalo de nuevo.";
  }

  // Chunk word-by-word for a streaming feel without a second full
  // generation pass (the content above is already fully generated).
  const words = finalContent.split(/(\s+)/);
  for (const word of words) {
    yield { type: "token", text: word };
  }

  return finalContent;
}
