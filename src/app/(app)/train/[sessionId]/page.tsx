import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Flame, Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getSessionWithDetails, getLastPerformance, getPrSetIds } from "@/lib/services/training";
import { countCompletedSets } from "@/lib/set-utils";
import { logSetAction, deleteSetAction, finishWorkoutAction } from "@/lib/actions/training";
import { ElapsedClock } from "@/components/training/elapsed-clock";
import { RestTimer } from "@/components/training/rest-timer";
import { PlateCalculatorButton } from "@/components/training/plate-calculator";
import { CancelWorkoutButton } from "@/components/training/cancel-workout-button";
import { ExerciseInfoDialog } from "@/components/exercises/exercise-info-dialog";
import { LastTimeReference } from "@/components/training/last-time-reference";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TrainSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ exercise?: string; set?: string; side?: string }>;
}) {
  const { sessionId } = await params;
  const { exercise: exerciseParam, set: setParam, side: sideParam } = await searchParams;
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

  const isUnilateral = current.is_unilateral;
  const currentSets = [...current.sets].sort((a, b) => a.set_number - b.set_number);
  // For unilateral exercises a "slot" (set number) isn't done until both
  // sides have a row — used for the numbered pill selector and progress math.
  const slotIsDone = (n: number) =>
    isUnilateral
      ? currentSets.some((s) => s.set_number === n && s.side === "left") &&
        currentSets.some((s) => s.set_number === n && s.side === "right")
      : currentSets.some((s) => s.set_number === n);
  const slotCount = Math.max(
    current.target_sets ?? 3,
    isUnilateral ? Math.max(0, ...currentSets.map((s) => s.set_number)) : currentSets.length,
    1,
  );
  const slots = Array.from({ length: slotCount }, (_, i) => i + 1);

  const totalSetsTarget = sessionExercises.reduce(
    (sum, e) => sum + Math.max(e.target_sets ?? 3, countCompletedSets(e.sets), 1),
    0,
  );
  const totalSetsDone = sessionExercises.reduce((sum, e) => sum + countCompletedSets(e.sets), 0);

  const firstIncomplete = slots.find((n) => !slotIsDone(n));
  const activeSet = Number(setParam) || firstIncomplete || slotCount;

  const leftSet = currentSets.find((s) => s.set_number === activeSet && s.side === "left");
  const rightSet = currentSets.find((s) => s.set_number === activeSet && s.side === "right");
  const activeSide: "both" | "left" | "right" = !isUnilateral
    ? "both"
    : sideParam === "left" || sideParam === "right"
      ? sideParam
      : !leftSet
        ? "left"
        : !rightSet
          ? "right"
          : "left";

  const existing = isUnilateral
    ? activeSide === "left"
      ? leftSet
      : rightSet
    : currentSets.find((s) => s.set_number === activeSet && s.side === "both");
  const lastSet = lastPerformance?.sets.find(
    (s) => s.set_number === activeSet && (!isUnilateral || s.side === activeSide),
  );
  const isPR = existing && prSetIds.has(existing.id);
  // Prefill a new set with what this same set number weighed last time —
  // matching it, not beating it. Saves retyping the common case and leaves
  // the decision to go up, hold or back off entirely with the user.
  const prefill = existing ?? lastSet ?? null;
  const weightDelta =
    existing?.weight_kg != null && lastSet?.weight_kg != null
      ? existing.weight_kg - lastSet.weight_kg
      : null;

  function setHref(n: number) {
    return `/train/${sessionId}?exercise=${current.id}&set=${n}`;
  }
  function sideHref(side: "left" | "right") {
    return `/train/${sessionId}?exercise=${current.id}&set=${activeSet}&side=${side}`;
  }

  // Between-sides rest (unilateral, just finished one side and waiting on
  // the other) takes priority over the normal between-sets rest.
  const showSideRest = isUnilateral && !!leftSet && !rightSet;
  const showSetRest = currentSets.length > 0 && !showSideRest;

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{session.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground/80">
              <ElapsedClock startedAt={session.started_at} />
            </span>
            <span aria-hidden>·</span>
            <span>
              {totalSetsDone} / {totalSetsTarget} series
            </span>
          </div>
        </div>
        <CancelWorkoutButton sessionId={sessionId} />
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {sessionExercises.map((ex, i) => {
          const exSeries = countCompletedSets(ex.sets);
          const done = exSeries >= (ex.target_sets ?? 1) && exSeries > 0;
          const isActive = ex.id === current.id;
          return (
            <Link key={ex.id} href={`/train/${sessionId}?exercise=${ex.id}`} className="shrink-0">
              <span
                className={`flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-success/30 bg-success/10 text-success"
                      : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : <span className="tabular-nums">{i + 1}</span>}
                {ex.exercises?.name}
              </span>
            </Link>
          );
        })}
      </div>

      <Card key={current.id} className="fade-up">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold tracking-tight">
              {current.exercises?.name}
            </CardTitle>
            {current.exercises && <ExerciseInfoDialog exercise={current.exercises} />}
          </div>
          {current.target_sets && (
            <p className="stat-label">
              Objetivo {current.target_sets} series
              {current.target_reps_min && current.target_reps_max
                ? ` · ${current.target_reps_min}-${current.target_reps_max} reps`
                : ""}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {slots.map((setNumber) => {
              const slotDone = slotIsDone(setNumber);
              const isActive = setNumber === activeSet;
              return (
                <Link key={setNumber} href={setHref(setNumber)} scroll={false}>
                  <span
                    className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-medium transition-[transform,background-color,border-color] duration-150 active:scale-95 ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : slotDone
                          ? "border-success/40 bg-success/10 text-success"
                          : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    {slotDone ? <Check className="h-4 w-4" /> : setNumber}
                  </span>
                </Link>
              );
            })}
          </div>

          {isUnilateral && (
            <div className="flex gap-2">
              {(["left", "right"] as const).map((side) => {
                const done = side === "left" ? !!leftSet : !!rightSet;
                const isActive = activeSide === side;
                return (
                  <Link key={side} href={sideHref(side)} scroll={false} className="flex-1">
                    <span
                      className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-full border text-sm font-medium transition-colors ${
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : done
                            ? "border-success/40 bg-success/10 text-success"
                            : "border-border text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {done && <Check className="h-3.5 w-3.5" />}
                      {side === "left" ? "Izquierda" : "Derecha"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="stat-label">
                Serie {activeSet} de {slotCount}
                {isUnilateral ? ` · ${activeSide === "left" ? "Izquierda" : "Derecha"}` : ""}
              </p>
              <div className="flex items-center gap-2">
                {isPR && (
                  <Badge className="gap-1 bg-success text-success-foreground pr-pop">
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
                    <ConfirmSubmitButton
                      confirmMessage="¿Eliminar esta serie?"
                      variant="ghost"
                      size="icon-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </ConfirmSubmitButton>
                  </form>
                )}
              </div>
            </div>
            <div className="mb-3">
              <LastTimeReference
                lastPerformance={lastPerformance}
                activeSet={activeSet}
                activeSide={activeSide}
                isUnilateral={isUnilateral}
              />
            </div>
            <form
              // Remount the inputs when the target set changes, so their
              // defaultValue actually re-applies — React otherwise keeps the
              // same uncontrolled DOM node and silently ignores the new prefill.
              key={`${current.id}-${activeSet}-${activeSide}`}
              action={logSetAction.bind(
                null,
                sessionId,
                current.id,
                current.exercise_id,
                activeSet,
                activeSide,
              )}
              className="space-y-3"
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="stat-label">Peso (kg)</label>
                    {(current.exercises?.equipment?.slug === "barbell" ||
                      current.exercises?.equipment?.slug === "smith_machine") && (
                      <PlateCalculatorButton defaultTargetKg={prefill?.weight_kg ?? 0} />
                    )}
                  </div>
                  <Input
                    name="weightKg"
                    type="number"
                    step="0.5"
                    min="0"
                    defaultValue={prefill?.weight_kg ?? ""}
                    placeholder="0"
                    className="h-16 rounded-xl text-center text-3xl font-bold tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="stat-label">Reps</label>
                  <Input
                    name="reps"
                    type="number"
                    min="0"
                    defaultValue={prefill?.reps ?? ""}
                    className="h-16 rounded-xl text-center text-3xl font-bold tabular-nums"
                  />
                </div>
                <div className="space-y-1">
                  <label className="stat-label">RIR</label>
                  <Input
                    name="rir"
                    type="number"
                    min="0"
                    max="10"
                    defaultValue={existing?.rir ?? ""}
                    className="h-16 rounded-xl text-center text-3xl font-bold tabular-nums"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full duration-fast active:scale-[0.98]">
                <Check className="h-4 w-4" />
                {existing ? "Guardar cambios" : "Completar serie"}
              </Button>
            </form>
          </div>

          {showSideRest && (
            <RestTimer
              key={`side-${currentSets.length}`}
              seconds={current.rest_between_sides_seconds ?? 60}
              label="Descanso entre lados"
            />
          )}
          {showSetRest && (
            <RestTimer key={`set-${currentSets.length}`} seconds={current.rest_seconds ?? 180} />
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
