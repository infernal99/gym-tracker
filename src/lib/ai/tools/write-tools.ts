import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/profile";
import { listMyTemplates, getTemplate } from "@/lib/services/routines";
import { listWeightEntries } from "@/lib/services/body";
import { resolveExercise } from "@/lib/ai/tools/read-tools";
import { goalTypeValues } from "@/lib/validation/goals";
import type { AITool } from "@/lib/ai/tools/types";
import type {
  GoalProposal,
  ProposalDay,
  ProposalExercise,
  RoutineChangeProposal,
  RoutineProposal,
} from "@/lib/ai/proposals";

// A 7B model produces loose JSON: nested objects sometimes arrive as
// strings, and key names drift ("name" vs "exerciseName", "sets" vs
// "targetSets"). These helpers absorb that instead of failing the turn.
function coerce<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  return value as T;
}

function asArray<T>(value: unknown): T[] {
  const parsed = coerce<T | T[]>(value);
  if (parsed == null) return [];
  return Array.isArray(parsed) ? parsed : [parsed];
}

function pickString(source: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickNumber(source: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    const parsed = typeof value === "string" ? Number(value) : value;
    if (typeof parsed === "number" && Number.isFinite(parsed)) return parsed;
  }
  return null;
}

const clampInt = (value: number, min: number, max: number) =>
  Math.min(Math.max(Math.round(value), min), max);

// "8-12", "8 a 12", "10" → [min, max]
function parseRepRange(raw: Record<string, unknown>): [number | null, number | null] {
  const min = pickNumber(raw, "repsMin", "targetRepsMin", "minReps");
  const max = pickNumber(raw, "repsMax", "targetRepsMax", "maxReps");
  if (min != null || max != null) {
    return [
      min != null ? clampInt(min, 1, 100) : null,
      max != null ? clampInt(max, 1, 100) : null,
    ];
  }

  const reps = pickString(raw, "reps", "repetitions", "targetReps");
  if (!reps) return [null, null];
  const numbers = reps.match(/\d+/g)?.map(Number) ?? [];
  if (numbers.length === 0) return [null, null];
  if (numbers.length === 1) return [clampInt(numbers[0], 1, 100), clampInt(numbers[0], 1, 100)];
  return [clampInt(numbers[0], 1, 100), clampInt(numbers[1], 1, 100)];
}

// Resolves one model-supplied exercise entry against the real library.
// Anything that doesn't match a real exercise is dropped, never invented.
async function resolveProposalExercise(
  raw: Record<string, unknown>,
): Promise<{ exercise: ProposalExercise | null; missingName: string | null }> {
  const name = pickString(raw, "exerciseName", "name", "exercise", "ejercicio");
  if (!name) return { exercise: null, missingName: null };

  const match = await resolveExercise(name);
  if (!match) return { exercise: null, missingName: name };

  const sets = pickNumber(raw, "sets", "targetSets", "series") ?? 3;
  const [repsMin, repsMax] = parseRepRange(raw);

  return {
    exercise: {
      exerciseId: match.id,
      exerciseName: match.name,
      muscleGroupName: match.muscle_groups?.name ?? null,
      targetSets: clampInt(sets, 1, 20),
      targetRepsMin: repsMin,
      targetRepsMax: repsMax,
    },
    missingName: null,
  };
}

const proposeRoutine: AITool = {
  definition: {
    name: "propose_routine",
    description:
      "Propone una rutina nueva al usuario y se la muestra como una tarjeta con un botón para añadirla. NO la crea: el usuario debe confirmarla. Usa SIEMPRE nombres de ejercicios que existan en la biblioteca (búscalos antes con find_exercises si no estás seguro).",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre de la rutina, ej. 'Push Pull Legs'" },
        description: { type: "string", description: "Descripción corta (opcional)" },
        setActive: {
          type: "string",
          description:
            "'true' solo si el usuario ha pedido explícitamente que sea su rutina principal/activa",
        },
        days: {
          type: "array",
          description:
            "Días de la rutina. Cada día: {\"name\":\"Push\",\"exercises\":[{\"exerciseName\":\"Press banca\",\"sets\":4,\"repsMin\":6,\"repsMax\":8}]}",
        },
      },
      required: ["name", "days"],
    },
  },
  execute: async ({ userId }, args) => {
    const name = pickString(args as Record<string, unknown>, "name") || "Rutina IA";
    const rawDays = asArray<Record<string, unknown>>(args.days);
    if (rawDays.length === 0) {
      return { ok: false, error: "No has indicado ningún día. Vuelve a llamar con el array days." };
    }

    const days: ProposalDay[] = [];
    const missingExercises: string[] = [];

    for (const rawDay of rawDays) {
      const dayName = pickString(rawDay, "name", "day", "dia", "título", "titulo") || `Día ${days.length + 1}`;
      const rawExercises = asArray<Record<string, unknown>>(rawDay.exercises ?? rawDay.ejercicios);

      const exercises: ProposalExercise[] = [];
      for (const rawExercise of rawExercises) {
        const { exercise, missingName } = await resolveProposalExercise(rawExercise);
        if (exercise) exercises.push(exercise);
        else if (missingName) missingExercises.push(missingName);
      }

      if (exercises.length > 0) days.push({ name: dayName.slice(0, 40), exercises });
    }

    if (days.length === 0) {
      return {
        ok: false,
        error:
          "Ninguno de los ejercicios existe en la biblioteca. Usa find_exercises para buscar nombres reales y vuelve a proponerla.",
      };
    }

    const warnings: string[] = [];
    if (missingExercises.length > 0) {
      warnings.push(
        `No están en la biblioteca y se han omitido: ${[...new Set(missingExercises)].join(", ")}`,
      );
    }

    // #47: don't silently create a near-duplicate of something they have.
    const existing = await listMyTemplates(userId);
    const similar = existing.find(
      (t) => !t.is_archived && (t.workout_template_days?.length ?? 0) === days.length,
    );
    if (similar) {
      warnings.push(`Ya tienes una rutina de ${days.length} días: "${similar.name}".`);
    }

    const proposal: RoutineProposal = {
      kind: "routine",
      name: name.slice(0, 60),
      description: pickString(args as Record<string, unknown>, "description") || null,
      setActive: String(args.setActive ?? "").toLowerCase() === "true",
      days,
      warnings,
    };

    const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);
    return {
      ok: true,
      shownToUser: true,
      summary: `${days.length} días, ${totalExercises} ejercicios`,
      warnings,
      instruction:
        "La tarjeta con la rutina ya se le ha mostrado al usuario. Resume en 1-2 frases qué has preparado y por qué, menciona cualquier aviso, y dile que pulse el botón de la tarjeta para añadirla. No repitas la lista completa de ejercicios.",
      __proposal: proposal,
    };
  },
};

const proposeGoal: AITool = {
  definition: {
    name: "propose_goal",
    description:
      "Propone un objetivo nuevo y se lo muestra al usuario como una tarjeta con un botón para crearlo. NO lo crea: el usuario debe confirmarlo.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          description: "Tipo de objetivo",
          enum: [...goalTypeValues],
        },
        title: { type: "string", description: "Título del objetivo, ej. 'Press banca 100 kg'" },
        targetValue: { type: "number", description: "Valor objetivo, ej. 100" },
        unit: { type: "string", description: "Unidad, ej. 'kg', 'reps', 'sesiones'" },
        exerciseName: {
          type: "string",
          description: "Ejercicio relacionado, si el objetivo es de fuerza o repeticiones",
        },
      },
      required: ["type", "title", "targetValue", "unit"],
    },
  },
  execute: async ({ userId }, args) => {
    const raw = args as Record<string, unknown>;
    const targetValue = pickNumber(raw, "targetValue", "target");
    if (targetValue == null) {
      return { ok: false, error: "Falta targetValue (un número)." };
    }

    const typeCandidate = pickString(raw, "type");
    const type = (goalTypeValues as readonly string[]).includes(typeCandidate)
      ? (typeCandidate as GoalProposal["type"])
      : "custom";

    let exerciseId: string | null = null;
    let exerciseName: string | null = null;
    let currentValue: number | null = null;

    const requestedExercise = pickString(raw, "exerciseName", "exercise");
    if (requestedExercise) {
      const match = await resolveExercise(requestedExercise);
      if (match) {
        exerciseId = match.id;
        exerciseName = match.name;

        // Seed "actual" from their real best lift so the card can show the gap.
        const supabase = await createClient();
        const { data: pr } = await supabase
          .from("personal_records")
          .select("weight_kg, value")
          .eq("user_id", userId)
          .eq("exercise_id", match.id)
          .eq("record_type", "max_weight")
          .order("value", { ascending: false })
          .limit(1)
          .maybeSingle();
        currentValue = pr?.weight_kg ?? pr?.value ?? null;
      }
    }

    if (type === "weight" && currentValue == null) {
      const entries = await listWeightEntries(userId);
      currentValue = entries[entries.length - 1]?.weightKg ?? null;
    }

    const proposal: GoalProposal = {
      kind: "goal",
      type,
      title: (pickString(raw, "title") || "Nuevo objetivo").slice(0, 80),
      exerciseId,
      exerciseName,
      currentValue,
      targetValue,
      unit: (pickString(raw, "unit") || "kg").slice(0, 20),
    };

    return {
      ok: true,
      shownToUser: true,
      currentValue,
      instruction:
        "La tarjeta del objetivo ya se le ha mostrado al usuario. Coméntalo en una frase y dile que pulse el botón para crearlo.",
      __proposal: proposal,
    };
  },
};

const proposeRoutineChange: AITool = {
  definition: {
    name: "propose_routine_change",
    description:
      "Propone añadir o quitar ejercicios de un día de una rutina existente, y se lo muestra al usuario como tarjeta con botón de confirmar. NO aplica el cambio por su cuenta. Consulta antes get_active_routine para saber los nombres reales de los días.",
    parameters: {
      type: "object",
      properties: {
        dayName: { type: "string", description: "Nombre del día a modificar, ej. 'Push'" },
        routineName: {
          type: "string",
          description: "Nombre de la rutina (opcional: por defecto, la rutina activa)",
        },
        addExercises: {
          type: "array",
          description:
            "Ejercicios a añadir: [{\"exerciseName\":\"Elevaciones laterales\",\"sets\":3,\"repsMin\":12,\"repsMax\":15}]",
        },
        removeExercises: {
          type: "array",
          description: "Nombres de ejercicios a quitar de ese día: [\"Press militar\"]",
        },
      },
      required: ["dayName"],
    },
  },
  execute: async ({ userId }, args) => {
    const raw = args as Record<string, unknown>;
    const profile = await getCurrentProfile();
    if (!profile || profile.id !== userId) return { ok: false, error: "No autorizado" };

    const templates = await listMyTemplates(userId);
    const requestedRoutine = pickString(raw, "routineName", "routine");
    const target = requestedRoutine
      ? templates.find((t) => t.name.toLowerCase().includes(requestedRoutine.toLowerCase()))
      : templates.find((t) => t.id === profile.active_template_id);

    if (!target) {
      return {
        ok: false,
        error: requestedRoutine
          ? `No he encontrado ninguna rutina llamada "${requestedRoutine}".`
          : "El usuario no tiene rutina activa. Pídele que indique cuál quiere modificar.",
      };
    }

    const template = await getTemplate(target.id);
    const dayName = pickString(raw, "dayName", "day", "dia");
    const day = (template?.workout_template_days ?? []).find((d) =>
      d.name.toLowerCase().includes(dayName.toLowerCase()),
    );
    if (!day) {
      return {
        ok: false,
        error: `No he encontrado el día "${dayName}" en la rutina "${target.name}". Días disponibles: ${(template?.workout_template_days ?? []).map((d) => d.name).join(", ")}`,
      };
    }

    const add: ProposalExercise[] = [];
    const missing: string[] = [];
    for (const rawExercise of asArray<Record<string, unknown>>(raw.addExercises)) {
      const entry =
        typeof rawExercise === "string" ? { exerciseName: rawExercise } : rawExercise;
      const { exercise, missingName } = await resolveProposalExercise(entry);
      if (exercise) add.push(exercise);
      else if (missingName) missing.push(missingName);
    }

    const remove: { rowId: string; exerciseName: string }[] = [];
    const dayExercises = day.workout_template_exercises ?? [];
    for (const rawName of asArray<unknown>(raw.removeExercises)) {
      const wanted = (
        typeof rawName === "string" ? rawName : pickString(rawName as Record<string, unknown>, "exerciseName", "name")
      )
        .toLowerCase()
        .trim();
      if (!wanted) continue;
      const row = dayExercises.find((te) => te.exercises?.name?.toLowerCase().includes(wanted));
      if (row) remove.push({ rowId: row.id, exerciseName: row.exercises?.name ?? "Ejercicio" });
    }

    if (add.length === 0 && remove.length === 0) {
      return {
        ok: false,
        error:
          missing.length > 0
            ? `No existen en la biblioteca: ${missing.join(", ")}. Busca nombres reales con find_exercises.`
            : "No has indicado ningún cambio válido.",
      };
    }

    const proposal: RoutineChangeProposal = {
      kind: "routine_change",
      templateId: target.id,
      templateName: target.name,
      dayId: day.id,
      dayName: day.name,
      add,
      remove,
    };

    return {
      ok: true,
      shownToUser: true,
      instruction:
        "La tarjeta con el cambio ya se le ha mostrado al usuario. Explícalo en una frase y dile que pulse el botón para aplicarlo.",
      __proposal: proposal,
    };
  },
};

// The one direct write: it flips a single reversible field the user asked
// about by name, and the answer names the routine back so a wrong match is
// immediately visible.
const setActiveRoutine: AITool = {
  definition: {
    name: "set_active_routine",
    description:
      "Marca una rutina YA EXISTENTE del usuario como su rutina principal/activa. Úsalo solo cuando el usuario lo pida claramente. Para rutinas nuevas usa propose_routine.",
    parameters: {
      type: "object",
      properties: {
        routineName: { type: "string", description: "Nombre de la rutina a activar" },
      },
      required: ["routineName"],
    },
  },
  execute: async ({ userId }, args) => {
    const wanted = pickString(args as Record<string, unknown>, "routineName", "name").toLowerCase();
    if (!wanted) return { ok: false, error: "Falta el nombre de la rutina." };

    const templates = await listMyTemplates(userId);
    const match = templates.find((t) => t.name.toLowerCase().includes(wanted));
    if (!match) {
      return {
        ok: false,
        error: `No he encontrado esa rutina. Las suyas son: ${templates.map((t) => t.name).join(", ")}`,
      };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ active_template_id: match.id })
      .eq("id", userId);
    if (error) return { ok: false, error: "No se ha podido activar la rutina." };

    return { ok: true, activatedRoutine: match.name };
  },
};

export const WRITE_TOOLS: AITool[] = [
  proposeRoutine,
  proposeGoal,
  proposeRoutineChange,
  setActiveRoutine,
];
