import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Clock, Dumbbell, Flame, Layers, Trophy, Weight } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getSessionWithDetails, getPreviousSessionForDay } from "@/lib/services/training";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

function pctChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default async function TrainSummaryPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const profile = await requireProfile();
  const session = await getSessionWithDetails(sessionId);

  if (!session) notFound();
  if (session.user_id !== profile.id) redirect("/dashboard");
  if (!session.completed_at) redirect(`/train/${sessionId}`);

  const sessionExercises = session.workout_session_exercises ?? [];
  const allSets = sessionExercises.flatMap((e) => e.sets);
  const totalReps = allSets.reduce((sum, s) => sum + (s.reps ?? 0), 0);

  const supabase = await createClient();
  const setIds = allSets.map((s) => s.id);
  const { data: prRows } =
    setIds.length > 0
      ? await supabase
          .from("personal_records")
          .select("*, exercises(name)")
          .in("session_set_id", setIds)
      : { data: [] };

  const previous = session.template_day_id
    ? await getPreviousSessionForDay(
        profile.id,
        session.template_day_id,
        session.started_at,
        sessionId,
      )
    : null;

  const previousReps = previous?.workout_session_exercises.reduce(
    (sum, e) => sum + e.sets.reduce((s, set) => s + (set.reps ?? 0), 0),
    0,
  );
  const volumeDelta = previous ? pctChange(session.total_volume_kg, previous.total_volume_kg) : null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="fade-up glow-primary flex flex-col items-center gap-2 rounded-2xl border bg-card px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <Trophy className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Entrenamiento completado</h1>
        <p className="text-muted-foreground">{session.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 fade-up [animation-delay:60ms]">
        <StatTile icon={Clock} label="Duración" value={formatDuration(session.duration_seconds ?? 0)} />
        <StatTile icon={Dumbbell} label="Ejercicios" value={sessionExercises.length} />
        <StatTile icon={Layers} label="Series" value={allSets.length} />
        <StatTile icon={Weight} label="Volumen" value={`${session.total_volume_kg} kg`} />
      </div>

      {prRows && prRows.length > 0 && (
        <div className="fade-up duration-emphasis space-y-2 rounded-2xl border border-success/30 bg-success/5 p-4 [animation-delay:120ms]">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
            <Flame className="h-4 w-4" />
            Nuevos récords
          </p>
          {prRows.map((pr) => (
            <div key={pr.id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{pr.exercises?.name}</span>
              <span className="font-semibold tabular-nums text-success">
                {pr.weight_kg} kg × {pr.reps}
              </span>
            </div>
          ))}
        </div>
      )}

      {previous && (
        <Card className="fade-up [animation-delay:160ms]">
          <CardHeader>
            <CardTitle className="text-base">Esta sesión vs la anterior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Volumen:{" "}
              {volumeDelta === null ? (
                "—"
              ) : (
                <span className={`font-semibold tabular-nums ${volumeDelta >= 0 ? "text-success" : "text-muted-foreground"}`}>
                  {volumeDelta >= 0 ? "+" : ""}
                  {volumeDelta.toFixed(1)}%
                </span>
              )}
            </p>
            <p className="tabular-nums">
              Repeticiones: {totalReps} (antes {previousReps ?? 0})
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <Button render={<Link href="/my-routine" />} className="w-full">
          Volver a Mi rutina
        </Button>
        <Button render={<Link href="/train/history" />} variant="outline" className="w-full">
          Ver historial
        </Button>
      </div>
    </div>
  );
}
