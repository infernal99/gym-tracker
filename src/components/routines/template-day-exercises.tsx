"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  addTemplateExerciseAction,
  removeTemplateExerciseAction,
} from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export function TemplateDayExercises({
  dayId,
  templateId,
  dayExercises,
  exercises,
}: {
  dayId: string;
  templateId: string;
  dayExercises: DayExercise[];
  exercises: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-3">
      {[...dayExercises]
        .sort((a, b) => a.order_index - b.order_index)
        .map((ex) => (
          <div
            key={ex.id}
            className="flex items-center justify-between rounded-xl border bg-surface px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium">{ex.exercises?.name}</p>
              <p className="text-xs text-muted-foreground">
                {ex.target_sets} series
                {ex.target_reps_min && ex.target_reps_max
                  ? ` · ${ex.target_reps_min}-${ex.target_reps_max} reps`
                  : ""}
                {ex.target_weight_kg ? ` · ${ex.target_weight_kg} kg` : ""}
                {ex.target_rir !== null ? ` · RIR ${ex.target_rir}` : ""}
                {` · ${ex.rest_seconds}s descanso`}
              </p>
            </div>
            <form action={removeTemplateExerciseAction.bind(null, ex.id, templateId)}>
              <Button type="submit" variant="ghost" size="icon-sm">
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </form>
          </div>
        ))}

      <details className="rounded-xl border px-3 py-2">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          + Añadir ejercicio
        </summary>
        <form
          action={addTemplateExerciseAction.bind(null, dayId, templateId)}
          className="mt-3 grid grid-cols-2 gap-2"
        >
          <div className="col-span-2">
            <Select name="exerciseId" required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ejercicio">
                  {(value: string) => exercises.find((e) => e.id === value)?.name ?? "Ejercicio"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Series</Label>
            <Input name="targetSets" type="number" min={1} defaultValue={3} required />
          </div>
          <div>
            <Label className="text-xs">Reps min</Label>
            <Input name="targetRepsMin" type="number" min={1} />
          </div>
          <div>
            <Label className="text-xs">Reps max</Label>
            <Input name="targetRepsMax" type="number" min={1} />
          </div>
          <div>
            <Label className="text-xs">Peso (kg)</Label>
            <Input name="targetWeightKg" type="number" step="0.5" min={0} />
          </div>
          <div>
            <Label className="text-xs">RIR</Label>
            <Input name="targetRir" type="number" min={0} max={10} />
          </div>
          <div>
            <Label className="text-xs">Descanso (s)</Label>
            <Input name="restSeconds" type="number" min={0} defaultValue={90} />
          </div>
          <div className="col-span-2 flex items-end">
            <Button type="submit" size="sm" className="w-full">
              <Plus className="h-3.5 w-3.5" />
              Añadir
            </Button>
          </div>
        </form>
      </details>
    </div>
  );
}
