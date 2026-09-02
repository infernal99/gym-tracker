import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Flame, Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getSessionWithDetails, getLastPerformance, getPrSetIds } from "@/lib/services/training";
import { logSetAction, deleteSetAction, finishWorkoutAction } from "@/lib/actions/training";
import { ElapsedClock } from "@/components/training/elapsed-clock";
import { RestTimer } from "@/components/training/rest-timer";
import { CancelWorkoutButton } from "@/components/training/cancel-workout-button";
import { ExerciseInfoDialog } from "@/components/exercises/exercise-info-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TrainSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ exercise?: string }>;
}) {
  const { sessionId } = await params;
  const { exercise: exerciseParam } = await searchParams;
  const profile = await requireProfile();
  const session = await getSessionWithDetails(sessionId);

  if (!session) notFound();
  if (session.user_id !== profile.id) redirect("/dashboard");
  if (session.completed_at) redirect(`/train/${sessionId}/summary`);

  const sessionExercises = [...(session.workout_session_exercises ?? [])].sort(
    (a, b) => a.order_index - b.order_index,
  );

  if (sessionExercises.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <p className="text-muted-foreground">
          Este entrenamiento no tiene ejercicios. Añade ejercicios a este día desde la rutina.
        </p>
        <CancelWorkoutButton sessionId={sessionId} />
      </div>
    );
  }

  const current =
    sessionExercises.find((e) => e.id === exerciseParam) ?? sessionExercises[0];
  const currentIndex = sessionExercises.findIndex((e) => e.id === current.id);
  const nextExercise = sessionExercises[currentIndex + 1];
  const isLastExercise = !nextExercise;

  const [lastPerformance, prSetIds] = await Promise.all([
    getLastPerformance(profile.id, current.exercise_id, sessionId),
    getPrSetIds(sessionExercises.flatMap((e) => e.sets.map((s) => s.id))),
  ]);

  const currentSets = [...current.sets].sort((a, b) => a.set_number - b.set_number);
  const slotCount = Math.max(current.target_sets ?? 3, currentSets.length, 1);
  const slots = Array.from({ length: slotCount }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{session.name}</h1>
          <p className="text-sm text-muted-foreground">
            <ElapsedClock startedAt={session.started_at} />
          </p>
        </div>
        <CancelWorkoutButton sessionId={sessionId} />
      </div>

      <div className="flex flex-wrap gap-2">
        {sessionExercises.map((ex, i) => {
          const done = ex.sets.length >= (ex.target_sets ?? 1) && ex.sets.length > 0;
          return (
            <Link key={ex.id} href={`/train/${sessionId}?exercise=${ex.id}`}>
              <Badge variant={ex.id === current.id ? "default" : "secondary"}>
                {done && <Check className="h-3 w-3" />}
                {i + 1}. {ex.exercises?.name}
              </Badge>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{current.exercises?.name}</CardTitle>
            {current.exercises && <ExerciseInfoDialog exercise={current.exercises} />}
          </div>
          {current.target_sets && (
            <p className="text-sm text-muted-foreground">
              Objetivo de rutina: {current.target_sets} series
              {current.target_reps_min && current.target_reps_max
                ? ` · ${current.target_reps_min}-${current.target_reps_max} reps`
                : ""}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {lastPerformance && lastPerformance.sets.length > 0 && (
            <div className="rounded-md border bg-muted/30 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">
                Última vez ({new Date(lastPerformance.completedAt).toLocaleDateString("es-ES")})
              </p>
              <p className="mt-1 text-sm">
                {lastPerformance.sets
                  .map((s) => `${s.weight_kg ?? "BW"} kg × ${s.reps ?? "-"}`)
                  .join(" · ")}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {slots.map((setNumber) => {
              const existing = currentSets.find((s) => s.set_number === setNumber);
              const lastSet = lastPerformance?.sets[setNumber - 1];
              const isPR = existing && prSetIds.has(existing.id);
              const weightDelta =
                existing?.weight_kg != null && lastSet?.weight_kg != null
                  ? existing.weight_kg - lastSet.weight_kg
                  : null;

              return (
                <div key={setNumber} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">Serie {setNumber}</p>
                    <div className="flex items-center gap-2">
                      {isPR && (
                        <Badge className="gap-1 bg-success text-success-foreground">
                          <Flame className="h-3 w-3" />
                          Nuevo PR
                        </Badge>
                      )}
                      {!isPR && weightDelta !== null && weightDelta !== 0 && (
                        <span
                          className={`text-xs font-medium ${weightDelta > 0 ? "text-success" : "text-muted-foreground"}`}
                        >
                          {weightDelta > 0 ? "↑" : "↓"} {Math.abs(weightDelta)} kg
                        </span>
                      )}
                      {existing && (
                        <form action={deleteSetAction.bind(null, sessionId, existing.id)}>
                          <Button type="submit" variant="ghost" size="icon-sm">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                  <form
                    action={logSetAction.bind(
                      null,
                      sessionId,
                      current.id,
                      current.exercise_id,
                      setNumber,
                    )}
                    className="grid grid-cols-3 gap-2"
                  >
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Peso (kg)</label>
                      <Input
                        name="weightKg"
                        type="number"
                        step="0.5"
                        min="0"
                        defaultValue={existing?.weight_kg ?? ""}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <Input
                        name="reps"
                        type="number"
                        min="0"
                        defaultValue={existing?.reps ?? ""}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">RIR (opcional)</label>
                      <Input
                        name="rir"
                        type="number"
                        min="0"
                        max="10"
                        defaultValue={existing?.rir ?? ""}
                      />
                    </div>
                    <Button type="submit" size="sm" className="col-span-3">
                      <Check className="h-3.5 w-3.5" />
                      {existing ? "Guardar cambios" : "Completar serie"}
                    </Button>
                  </form>
                </div>
              );
            })}
          </div>

          {currentSets.length > 0 && (
            <RestTimer key={currentSets.length} seconds={current.rest_seconds ?? 90} />
          )}
        </CardContent>
      </Card>

      {nextExercise ? (
        <Button
          render={<Link href={`/train/${sessionId}?exercise=${nextExercise.id}`} />}
          className="w-full"
        >
          <ArrowRight className="h-4 w-4" />
          Siguiente ejercicio ({nextExercise.exercises?.name})
        </Button>
      ) : (
        <form action={finishWorkoutAction.bind(null, sessionId)}>
          <Button type="submit" className="w-full">
            <Check className="h-4 w-4" />
            Finalizar entrenamiento
          </Button>
        </form>
      )}

      {!isLastExercise && (
        <form action={finishWorkoutAction.bind(null, sessionId)}>
          <Button type="submit" variant="outline" className="w-full">
            Finalizar entrenamiento ahora
          </Button>
        </form>
      )}
    </div>
  );
}
