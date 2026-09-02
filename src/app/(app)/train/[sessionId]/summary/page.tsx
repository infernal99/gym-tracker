import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Flame, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getSessionWithDetails, getPreviousSessionForDay } from "@/lib/services/training";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="text-center">
        <Trophy className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Entrenamiento completado</h1>
        <p className="text-muted-foreground">{session.name}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Duración", value: formatDuration(session.duration_seconds ?? 0) },
          { label: "Ejercicios", value: sessionExercises.length },
          { label: "Series", value: allSets.length },
          { label: "Volumen", value: `${session.total_volume_kg} kg` },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-xl font-semibold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {prRows && prRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-4 w-4 text-primary" />
              Nuevos récords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {prRows.map((pr) => (
              <p key={pr.id} className="text-sm">
                <span className="font-medium">{pr.exercises?.name}</span>{" "}
                {pr.weight_kg} kg × {pr.reps}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {previous && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Esta sesión vs la anterior</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Volumen:{" "}
              {volumeDelta === null ? (
                "—"
              ) : (
                <span className={volumeDelta >= 0 ? "text-primary" : "text-muted-foreground"}>
                  {volumeDelta >= 0 ? "+" : ""}
                  {volumeDelta.toFixed(1)}%
                </span>
              )}
            </p>
            <p>
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
