"use client";

import { useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import {
  addTemplateExerciseAction,
  removeTemplateExerciseAction,
  updateTemplateExerciseAction,
} from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DayExercise = {
  id: string;
  order_index: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  rest_seconds: number | null;
  exercises: { name: string } | null;
};

type ExerciseOption = { id: string; name: string };

function ExerciseFieldsGrid({
  defaults,
}: {
  defaults?: Partial<{
    targetSets: number | null;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    targetWeightKg: number | null;
    targetRir: number | null;
    restSeconds: number | null;
  }>;
}) {
  return (
    <>
      <div>
        <Label className="text-xs">Series</Label>
        <Input
          name="targetSets"
          type="number"
          min={1}
          defaultValue={defaults?.targetSets ?? 3}
          required
        />
      </div>
      <div>
        <Label className="text-xs">Reps min</Label>
        <Input
          name="targetRepsMin"
          type="number"
          min={1}
          defaultValue={defaults?.targetRepsMin ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">Reps max</Label>
        <Input
          name="targetRepsMax"
          type="number"
          min={1}
          defaultValue={defaults?.targetRepsMax ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">Peso (kg)</Label>
        <Input
          name="targetWeightKg"
          type="number"
          step="0.5"
          min={0}
          defaultValue={defaults?.targetWeightKg ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">RIR</Label>
        <Input
          name="targetRir"
          type="number"
          min={0}
          max={10}
          defaultValue={defaults?.targetRir ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">Descanso (s)</Label>
        <Input
          name="restSeconds"
          type="number"
          min={0}
          defaultValue={defaults?.restSeconds ?? 90}
        />
      </div>
    </>
  );
}

function ExerciseRow({
  exercise,
  templateId,
}: {
  exercise: DayExercise;
  templateId: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData) => {
          await updateTemplateExerciseAction(exercise.id, templateId, formData);
          setEditing(false);
        }}
        className="space-y-2 rounded-xl border border-primary/30 bg-surface p-3"
      >
        <p className="text-sm font-medium">{exercise.exercises?.name}</p>
        <div className="grid grid-cols-2 gap-2">
          <ExerciseFieldsGrid
            defaults={{
              targetSets: exercise.target_sets,
              targetRepsMin: exercise.target_reps_min,
              targetRepsMax: exercise.target_reps_max,
              targetWeightKg: exercise.target_weight_kg,
              targetRir: exercise.target_rir,
              restSeconds: exercise.rest_seconds,
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1">
            Guardar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setEditing(false)}
          >
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-surface px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{exercise.exercises?.name}</p>
        <p className="text-xs text-muted-foreground">
          {exercise.target_sets} series
          {exercise.target_reps_min && exercise.target_reps_max
            ? ` · ${exercise.target_reps_min}-${exercise.target_reps_max} reps`
            : ""}
          {exercise.target_weight_kg ? ` · ${exercise.target_weight_kg} kg` : ""}
          {exercise.target_rir !== null ? ` · RIR ${exercise.target_rir}` : ""}
          {` · ${exercise.rest_seconds}s descanso`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <form action={removeTemplateExerciseAction.bind(null, exercise.id, templateId)}>
          <Button type="submit" variant="ghost" size="icon-sm">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function AddExerciseForm({
  dayId,
  templateId,
  exercises,
}: {
  dayId: string;
  templateId: string;
  exercises: ExerciseOption[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ExerciseOption | null>(null);

  const matches =
    !selected && query.trim()
      ? exercises
          .filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  return (
    <form
      action={addTemplateExerciseAction.bind(null, dayId, templateId)}
      className="mt-3 space-y-2"
      onSubmit={() => {
        setQuery("");
        setSelected(null);
      }}
    >
      <input type="hidden" name="exerciseId" value={selected?.id ?? ""} />

      {!selected ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ejercicio..."
            className="pl-8"
          />
          {matches.length > 0 && (
            <div className="absolute inset-x-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-xl border bg-popover shadow-md">
              {matches.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    setSelected(exercise);
                    setQuery("");
                  }}
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {exercise.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border bg-surface px-3 py-2">
          <p className="text-sm font-medium">{selected.name}</p>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {selected && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <ExerciseFieldsGrid />
          </div>
          <Button type="submit" size="sm" className="w-full">
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </Button>
        </>
      )}
    </form>
  );
}

export function TemplateDayExercises({
  dayId,
  templateId,
  dayExercises,
  exercises,
}: {
  dayId: string;
  templateId: string;
  dayExercises: DayExercise[];
  exercises: ExerciseOption[];
}) {
  return (
    <div className="space-y-3">
      {[...dayExercises]
        .sort((a, b) => a.order_index - b.order_index)
        .map((ex) => (
          <ExerciseRow key={ex.id} exercise={ex} templateId={templateId} />
        ))}

      <details className="rounded-xl border px-3 py-2">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          + Añadir ejercicio
        </summary>
        <AddExerciseForm dayId={dayId} templateId={templateId} exercises={exercises} />
      </details>
    </div>
  );
}
