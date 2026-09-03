"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { matchesExerciseQuery } from "@/lib/exercise-search";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import {
  addTemplateExerciseAction,
  removeTemplateExerciseAction,
  updateTemplateExerciseAction,
  reorderTemplateExercisesAction,
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
  is_unilateral: boolean;
  rest_between_sides_seconds: number | null;
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
    isUnilateral: boolean;
    restBetweenSidesSeconds: number | null;
  }>;
}) {
  const checkboxId = useId();
  const [isUnilateral, setIsUnilateral] = useState(defaults?.isUnilateral ?? false);

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
          defaultValue={defaults?.restSeconds ?? 180}
        />
      </div>
      <div className="col-span-2 flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
        <input
          id={checkboxId}
          name="isUnilateral"
          type="checkbox"
          defaultChecked={defaults?.isUnilateral ?? false}
          onChange={(e) => setIsUnilateral(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <Label htmlFor={checkboxId} className="cursor-pointer text-xs font-normal">
          Unilateral (un lado a la vez)
        </Label>
      </div>
      {isUnilateral && (
        <div className="col-span-2">
          <Label className="text-xs">Descanso entre lados (s)</Label>
          <Input
            name="restBetweenSidesSeconds"
            type="number"
            min={0}
            defaultValue={defaults?.restBetweenSidesSeconds ?? 60}
          />
        </div>
      )}
    </>
  );
}

function ExerciseRow({
  exercise,
  templateId,
  isFirst,
  isLast,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
}: {
  exercise: DayExercise;
  templateId: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  dragging: boolean;
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
              isUnilateral: exercise.is_unilateral,
              restBetweenSidesSeconds: exercise.rest_between_sides_seconds,
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
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-center gap-2 rounded-xl border bg-surface px-2 py-2 transition-opacity duration-fast ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <span className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{exercise.exercises?.name}</p>
        <p className="text-xs text-muted-foreground">
          {exercise.target_sets} series
          {exercise.target_reps_min && exercise.target_reps_max
            ? ` · ${exercise.target_reps_min}-${exercise.target_reps_max} reps`
            : ""}
          {exercise.target_weight_kg ? ` · ${exercise.target_weight_kg} kg` : ""}
          {exercise.target_rir !== null ? ` · RIR ${exercise.target_rir}` : ""}
          {` · ${exercise.rest_seconds}s descanso`}
          {exercise.is_unilateral ? ` · unilateral (+${exercise.rest_between_sides_seconds}s/lado)` : ""}
        </p>
      </div>
      <div className="flex shrink-0 flex-col">
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onMove(-1)}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => onMove(1)}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <form action={removeTemplateExerciseAction.bind(null, exercise.id, templateId)}>
          <ConfirmSubmitButton
            confirmMessage={`¿Quitar "${exercise.exercises?.name}" de este día?`}
            variant="ghost"
            size="icon-sm"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </ConfirmSubmitButton>
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
  const [open, setOpen] = useState(false);

  // With no query, show the full list (browsable) rather than nothing — the
  // exercise might be there under a different name than what comes to mind.
  const matches =
    selected || !open
      ? []
      : query.trim()
        ? exercises.filter((e) => matchesExerciseQuery(e.name, query)).slice(0, 8)
        : exercises.slice(0, 50);

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
        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              placeholder="Buscar ejercicio..."
              className="pl-8"
            />
          </div>
          {matches.length > 0 && (
            // A normal block below the input (not absolutely positioned)
            // so it can't get clipped by an ancestor's overflow-hidden —
            // several day-card containers have one for their rounded
            // corners, which was cutting this list off instead of letting
            // it float over the rest of the form.
            <div
              className="mt-1 max-h-48 overflow-y-auto rounded-xl border bg-popover shadow-md"
              // Fires before the input's blur, so the click below still
              // lands instead of the list closing out from under it.
              onMouseDown={(e) => e.preventDefault()}
            >
              {matches.map((exercise) => (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    setSelected(exercise);
                    setQuery("");
                    setOpen(false);
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
  const [items, setItems] = useState(() =>
    [...dayExercises].sort((a, b) => a.order_index - b.order_index),
  );
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    setItems([...dayExercises].sort((a, b) => a.order_index - b.order_index));
  }, [dayExercises]);

  function persistOrder(next: DayExercise[]) {
    setItems(next);
    reorderTemplateExercisesAction(
      templateId,
      next.map((i) => i.id),
    );
  }

  function moveByStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(next);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const from = items.findIndex((i) => i.id === dragId);
    const to = items.findIndex((i) => i.id === targetId);
    if (from === -1 || to === -1) {
      setDragId(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    persistOrder(next);
  }

  return (
    <div className="space-y-3">
      {items.map((ex, index) => (
        <ExerciseRow
          key={ex.id}
          exercise={ex}
          templateId={templateId}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onMove={(direction) => moveByStep(index, direction)}
          onDragStart={() => setDragId(ex.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(ex.id)}
          dragging={dragId === ex.id}
        />
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
