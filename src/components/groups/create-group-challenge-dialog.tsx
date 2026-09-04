"use client";

import { useState } from "react";
import { Plus, Search, Swords } from "lucide-react";
import { createGroupChallengeAction } from "@/lib/actions/groups";
import {
  groupChallengeMetricLabels,
  groupChallengeMetricValues,
  groupChallengeUnit,
  type GroupChallengeMetric,
} from "@/lib/validation/group-challenges";
import { matchesExerciseQuery } from "@/lib/exercise-search";
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

type ExerciseOption = { id: string; name: string };

export function CreateGroupChallengeDialog({
  groupId,
  exercises,
}: {
  groupId: string;
  exercises: ExerciseOption[];
}) {
  const [metric, setMetric] = useState<GroupChallengeMetric>("workouts");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);

  const matches =
    metric === "exercise" && exerciseQuery.trim()
      ? exercises.filter((e) => matchesExerciseQuery(e.name, exerciseQuery)).slice(0, 8)
      : [];

  const today = new Date().toISOString().slice(0, 10);
  const inOneMonth = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Plus className="h-4 w-4" />
        Nuevo reto
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-4 w-4" />
            Reto de grupo
          </DialogTitle>
          <DialogDescription>Todo el grupo entra automáticamente.</DialogDescription>
        </DialogHeader>
        <form action={createGroupChallengeAction.bind(null, groupId)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="metric">Tipo</Label>
            <Select name="metric" value={metric} onValueChange={(v) => setMetric(v as GroupChallengeMetric)}>
              <SelectTrigger id="metric" className="w-full">
                <SelectValue>{(v: GroupChallengeMetric) => groupChallengeMetricLabels[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {groupChallengeMetricValues.map((m) => (
                  <SelectItem key={m} value={m}>
                    {groupChallengeMetricLabels[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {metric === "exercise" && (
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
            <Label htmlFor="challenge-name">Título</Label>
            <Input
              id="challenge-name"
              name="name"
              placeholder={metric === "workouts" ? "Ej: Constancia de septiembre" : "Ej: Reto de press banca"}
              maxLength={80}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetValue">Meta ({groupChallengeUnit[metric]})</Label>
            <Input id="targetValue" name="targetValue" type="number" step="0.5" min="0" required />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="challenge-start">Inicio</Label>
              <Input id="challenge-start" name="startDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="challenge-end">Fin</Label>
              <Input id="challenge-end" name="endDate" type="date" defaultValue={inOneMonth} required />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="isCollective" className="mt-0.5 h-4 w-4" />
            <span>
              Reto colectivo — sumar las aportaciones de todos hacia la meta, en vez de competir cada
              uno por su cuenta
            </span>
          </label>

          <Button type="submit" className="w-full">
            Crear reto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
