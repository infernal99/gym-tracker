import "server-only";
import { OllamaProvider } from "@/lib/ai/providers/ollama";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { ALL_TOOLS } from "@/lib/ai/tools";
import type { AIMessage } from "@/lib/ai/types";
import type { AIProvider } from "@/lib/ai/provider";
import type { AIProposal } from "@/lib/ai/proposals";

// Swapping providers later means changing this one line (or reading an env
// var to pick a class) — nothing downstream references Ollama directly.
const provider: AIProvider = new OllamaProvider();

const MAX_TOOL_ROUNDS = 4;

// Matches the model claiming a proposal card / creation happened.
const FALSE_COMPLETION_PATTERN =
  /se ha (creado|propuesto|añadido|generado)|ya (se te ha|te he) mostrado|tarjeta (ya|se)/i;

// A 7B model occasionally narrates a fake tool call as plain text instead
// of emitting a real one ("CallCheck find_exercises {...}") — the system
// prompt explicitly forbids ever naming a tool, so any answer that does is
// definitely a leak, never a legitimate response, regardless of wording.
const TOOL_NAME_LEAK_PATTERN = new RegExp(
  ALL_TOOLS.map((t) => t.definition.name).join("|"),
  "i",
);

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
  propose_routine: "Preparando tu rutina...",
  propose_goal: "Preparando tu objetivo...",
  propose_routine_change: "Revisando tu rutina...",
  set_active_routine: "Actualizando tu rutina principal...",
};

export type AIStreamEvent =
  | { type: "status"; text: string }
  | { type: "token"; text: string }
  | { type: "proposal"; proposal: AIProposal }
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
  const toolDefinitions = ALL_TOOLS.map((t) => t.definition);
  const toolsByName = new Map(ALL_TOOLS.map((t) => [t.definition.name, t]));

  let finalContent = "";
  let proposalEmitted = false;

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

        // A write-intent tool attaches the card the user has to confirm.
        // It goes to the UI, never into the model's context — the model
        // only needs to know the card was shown.
        if (resultPayload && typeof resultPayload === "object" && "__proposal" in resultPayload) {
          const { __proposal, ...modelVisible } = resultPayload as Record<string, unknown>;
          yield { type: "proposal", proposal: __proposal as AIProposal };
          proposalEmitted = true;
          resultPayload = modelVisible;
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
    // A 7B model occasionally narrates a fake tool call as text instead of
    // emitting a real one. One corrective retry, telling it plainly what it
    // did wrong, resolves this more often than not — cheaper than always
    // falling back straight to a generic apology.
    if (TOOL_NAME_LEAK_PATTERN.test(finalContent)) {
      messages.push({ role: "assistant", content: finalContent });
      messages.push({
        role: "user",
        content:
          "Tu respuesta anterior no es válida: mencionaste el nombre de una herramienta interna como si fuera texto normal. No hagas eso. O llamas de verdad a la herramienta, o respondes en lenguaje natural sin nombrarla. Vuelve a responder a mi petición anterior correctamente.",
      });
      const retry = await provider.chat(messages, toolDefinitions);
      finalContent =
        retry.toolCalls.length === 0 && !TOOL_NAME_LEAK_PATTERN.test(retry.content)
          ? retry.content
          : "No he podido completar esa acción correctamente. ¿Puedes reformular tu petición?";
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

  // Safety net for a real failure mode of small local models: after seeing
  // a tool's "the card is already shown" instruction once in context, it
  // can later claim the same thing in a turn where it never actually called
  // propose_* — the UI only renders a card from a real proposal event, so
  // nothing fake gets created, but the claim itself would still mislead the
  // user. If the text asserts a card/creation happened but no proposal was
  // actually emitted this turn, replace it with an honest fallback instead.
  if (!proposalEmitted && FALSE_COMPLETION_PATTERN.test(finalContent)) {
    finalContent =
      "Puedo prepararte eso, pero necesito reformular la búsqueda. ¿Puedes pedírmelo de nuevo, quizá con algo más de detalle?";
  }

  // Chunk word-by-word for a streaming feel without a second full
  // generation pass (the content above is already fully generated).
  const words = finalContent.split(/(\s+)/);
  for (const word of words) {
    yield { type: "token", text: word };
  }

  return finalContent;
}
