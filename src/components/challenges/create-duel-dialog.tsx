"use client";

import { useActionState, useState } from "react";
import { Search, Swords } from "lucide-react";
import { createDuelAction } from "@/lib/actions/duels";
import { duelMetricLabels, duelMetricValues, type DuelMetricOption } from "@/lib/validation/duels";
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

type FriendOption = { id: string; displayName: string; username: string };
type ExerciseOption = { id: string; name: string };

export function CreateDuelDialog({
  friends,
  exercises,
}: {
  friends: FriendOption[];
  exercises: ExerciseOption[];
}) {
  const [state, formAction, pending] = useActionState(createDuelAction, initialState);
  const [metric, setMetric] = useState<DuelMetricOption>("workouts");
  const [opponentId, setOpponentId] = useState(friends[0]?.id ?? "");
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExerciseOption | null>(null);

  const matches =
    metric === "exercise" && exerciseQuery.trim()
      ? exercises.filter((e) => matchesExerciseQuery(e.name, exerciseQuery)).slice(0, 8)
      : [];

  const today = new Date().toISOString().slice(0, 10);
  const inTwoWeeks = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

  if (friends.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Swords className="h-4 w-4" />
        Necesitas amigos para retar
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Swords className="h-4 w-4" />
        Retar a un amigo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo duelo</DialogTitle>
          <DialogDescription>Cara a cara contra un amigo, gana quien tenga más al terminar.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="opponentId">A quién retas</Label>
            <Select name="opponentId" value={opponentId} onValueChange={(v) => setOpponentId(v ?? "")}>
              <SelectTrigger id="opponentId" className="w-full">
                <SelectValue>
                  {(v: string) => friends.find((f) => f.id === v)?.displayName ?? "Elige un amigo"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {friends.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.displayName} (@{f.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metric">En qué compite</Label>
            <Select name="metric" value={metric} onValueChange={(v) => setMetric(v as DuelMetricOption)}>
              <SelectTrigger id="metric" className="w-full">
                <SelectValue>{(v: DuelMetricOption) => duelMetricLabels[v]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {duelMetricValues.map((m) => (
                  <SelectItem key={m} value={m}>
                    {duelMetricLabels[m]}
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
            <Label htmlFor="name">Título</Label>
            <Input
              id="name"
              name="name"
              placeholder={
                metric === "exercise"
                  ? "Ej: Quién levanta más en press banca"
                  : "Ej: Quién entrena más esta quincena"
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Inicio</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={today} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fin</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={inTwoWeeks} required />
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando..." : "Retar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
