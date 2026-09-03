"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { addTemplateExerciseAction } from "@/lib/actions/routines";
import type { listExercises } from "@/lib/services/exercises";
import { matchesExerciseQuery } from "@/lib/exercise-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Exercise = Awaited<ReturnType<typeof listExercises>>[number];

export function ExercisePicker({
  dayId,
  templateId,
  exercises,
}: {
  dayId: string;
  templateId: string;
  exercises: Exercise[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const results = (
    normalizedQuery
      ? exercises.filter(
          (exercise) =>
            matchesExerciseQuery(exercise.name, query) ||
            exercise.muscle_groups?.name.toLowerCase().includes(normalizedQuery),
        )
      : exercises
  ).slice(0, 20);

  return (
    <div className="space-y-2 rounded-xl border p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={selected ? selected.name : query}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Buscar por ejercicio o músculo (p. ej. espalda)..."
          className="pl-8"
        />
      </div>

      {!selected && isOpen && results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-xl border">
          {results.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => {
                setSelected(exercise);
                setQuery("");
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span>{exercise.name}</span>
              {exercise.muscle_groups && (
                <span className="text-xs text-muted-foreground">
                  {exercise.muscle_groups.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <form
          action={addTemplateExerciseAction.bind(null, dayId, templateId)}
          className="flex items-end gap-2"
          onSubmit={() => setSelected(null)}
        >
          <input type="hidden" name="exerciseId" value={selected.id} />
          <p className="flex-1 text-sm font-medium">{selected.name}</p>
          <div className="w-20 space-y-1">
            <label className="text-xs text-muted-foreground">Series</label>
            <Input name="targetSets" type="number" min={1} defaultValue={3} required />
          </div>
          <Button type="submit" size="sm">
            <Plus className="h-3.5 w-3.5" />
            Añadir
          </Button>
        </form>
      )}
    </div>
  );
}
