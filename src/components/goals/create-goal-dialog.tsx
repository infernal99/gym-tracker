"use client";

import { useActionState, useState } from "react";
import { Plus, Search } from "lucide-react";
import { createGoalAction } from "@/lib/actions/goals";
import { goalTypeLabels, goalTypeValues } from "@/lib/validation/goals";
import { matchesExerciseQuery } from "@/lib/exercise-search";
import type { ActionResult } from "@/lib/actions/auth";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionResult = { error: null };

type ExerciseOption = { id: string; name: string };

export function CreateGoalDialog({ exercises }: { exercises: ExerciseOption[] }) {
  const [state, formAction, pending] = useActionState(createGoalAction, initialState);
  const [type, setType] = useState<(typeof goalTypeValues)[number]>("strength");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);

  const matches =
    type === "strength" && exerciseQuery.trim()
      ? exercises
          .filter((e) => matchesExerciseQuery(e.name, exerciseQuery))
          .slice(0, 8)
      : [];

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Nuevo objetivo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo objetivo</DialogTitle>
          <DialogDescription>Define una meta y sigue tu progreso hacia ella.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue>{(v: typeof type) => goalTypeLabels[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {goalTypeValues.map((t) => (
                  <SelectItem key={t} value={t}>
                    {goalTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "strength" && (
            <div className="space-y-2">
              <Label htmlFor="exerciseSearch">Ejercicio</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="exerciseSearch"
                  value={selectedExercise ? selectedExercise.name : exerciseQuery}
                  onChange={(e) => {
                    setSelectedExercise(null);
                    setExerciseQuery(e.target.value);
                  }}
                  placeholder="Buscar ejercicio..."
                  className="pl-8"
                />
              </div>
              {!selectedExercise && matches.length > 0 && (
                <div className="max-h-40 overflow-y-auto rounded-xl border">
                  {matches.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => {
                        setSelectedExercise(ex);
                        setExerciseQuery("");
                      }}
                      className="flex w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      {ex.name}
                    </button>
                  ))}
                </div>
              )}
              <input type="hidden" name="exerciseId" value={selectedExercise?.id ?? ""} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              placeholder={type === "strength" ? "Ej: Press banca a 100 kg" : "Ej: Bajar a 75 kg"}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="initialValue">Actual</Label>
              <Input id="initialValue" name="initialValue" type="number" step="0.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetValue">Meta</Label>
              <Input id="targetValue" name="targetValue" type="number" step="0.1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unidad</Label>
              <Input id="unit" name="unit" placeholder="kg" defaultValue="kg" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Fecha objetivo (opcional)</Label>
            <Input id="targetDate" name="targetDate" type="date" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando..." : "Crear objetivo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
