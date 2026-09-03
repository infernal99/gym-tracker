"use client";

import { useActionState, useState } from "react";
import { Plus, Search } from "lucide-react";
import { createChallengeAction } from "@/lib/actions/challenges";
import { challengeTypeLabels, challengeTypeValues, type ChallengeTypeOption } from "@/lib/validation/challenges";
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

const unitHint: Record<ChallengeTypeOption, string> = {
  body_weight: "kg objetivo",
  exercise: "kg objetivo",
  consistency: "nº de entrenos",
};

export function CreateChallengeDialog({ exercises }: { exercises: ExerciseOption[] }) {
  const [state, formAction, pending] = useActionState(createChallengeAction, initialState);
  const [type, setType] = useState<ChallengeTypeOption>("consistency");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);

  const matches =
    type === "exercise" && exerciseQuery.trim()
      ? exercises
          .filter((e) => e.name.toLowerCase().includes(exerciseQuery.trim().toLowerCase()))
          .slice(0, 8)
      : [];

  const today = new Date().toISOString().slice(0, 10);
  const inOneMonth = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Nuevo reto
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo reto</DialogTitle>
          <DialogDescription>
            Elige tu propio desafío y un plazo para conseguirlo.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" value={type} onValueChange={(v) => setType(v as ChallengeTypeOption)}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue>{(v: ChallengeTypeOption) => challengeTypeLabels[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {challengeTypeValues.map((t) => (
                  <SelectItem key={t} value={t}>
                    {challengeTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === "exercise" && (
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
            <Label htmlFor="name">Título</Label>
            <Input
              id="name"
              name="name"
              placeholder={
                type === "consistency"
                  ? "Ej: No fallar ningún entreno este mes"
                  : type === "body_weight"
                    ? "Ej: Bajar a 75 kg"
                    : "Ej: Press banca a 100 kg"
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Meta ({unitHint[type]})</Label>
            <Input id="targetValue" name="targetValue" type="number" step="0.1" required />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fin</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={inOneMonth} required />
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando..." : "Crear reto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
