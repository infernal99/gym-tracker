"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { createExerciseAction } from "@/lib/actions/exercises";
import { difficultyValues, movementTypeValues } from "@/lib/validation/exercises";
import { difficultyLabels, movementTypeLabels } from "@/lib/exercise-labels";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function CreateExerciseDialog({
  muscleGroups,
  equipment,
}: {
  muscleGroups: { id: string; name: string }[];
  equipment: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createExerciseAction, initialState);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="icon" />}>
        <Plus className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear ejercicio</DialogTitle>
          <DialogDescription>
            ¿Falta un ejercicio en la biblioteca? Añádelo y podrás usarlo en tus rutinas.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Ej: Press Arnold" required maxLength={80} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="muscleGroupId">Grupo muscular</Label>
            <Select name="muscleGroupId" required>
              <SelectTrigger id="muscleGroupId" className="w-full">
                <SelectValue placeholder="Selecciona un grupo">
                  {(value: string) => muscleGroups.find((mg) => mg.id === value)?.name ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((mg) => (
                  <SelectItem key={mg.id} value={mg.id}>
                    {mg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="equipmentId">Equipamiento (opcional)</Label>
            <Select name="equipmentId">
              <SelectTrigger id="equipmentId" className="w-full">
                <SelectValue placeholder="Sin equipamiento">
                  {(value: string) =>
                    equipment.find((eq) => eq.id === value)?.name ?? "Sin equipamiento"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {equipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad</Label>
              <Select name="difficulty" defaultValue="intermediate" required>
                <SelectTrigger id="difficulty" className="w-full">
                  <SelectValue>
                    {(value: (typeof difficultyValues)[number]) => difficultyLabels[value]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {difficultyValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {difficultyLabels[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="movementType">Tipo</Label>
              <Select name="movementType" defaultValue="compound" required>
                <SelectTrigger id="movementType" className="w-full">
                  <SelectValue>
                    {(value: (typeof movementTypeValues)[number]) => movementTypeLabels[value]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {movementTypeValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {movementTypeLabels[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea id="description" name="description" rows={2} maxLength={500} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando..." : "Crear ejercicio"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
