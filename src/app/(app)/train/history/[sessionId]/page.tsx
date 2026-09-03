import { notFound, redirect } from "next/navigation";
import { Clock, Dumbbell, Layers, Weight } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getSessionWithDetails } from "@/lib/services/training";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TrainHistoryDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const profile = await requireProfile();
  const session = await getSessionWithDetails(sessionId);

  if (!session) notFound();
  if (session.user_id !== profile.id) redirect("/train/history");

  const sessionExercises = [...(session.workout_session_exercises ?? [])].sort(
    (a, b) => a.order_index - b.order_index,
  );
  const totalSets = sessionExercises.reduce((sum, e) => sum + e.sets.length, 0);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="fade-up">
        <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
        <p className="text-muted-foreground">
          {session.completed_at &&
            new Date(session.completed_at).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 fade-up [animation-delay:60ms]">
        <StatTile
          icon={Clock}
          label="Duración"
          value={
            session.duration_seconds ? `${Math.round(session.duration_seconds / 60)}min` : "—"
          }
        />
        <StatTile icon={Layers} label="Series" value={totalSets} />
        <StatTile icon={Weight} label="Volumen" value={`${session.total_volume_kg} kg`} />
      </div>

      <div className="space-y-3 fade-up [animation-delay:100ms]">
        {sessionExercises.map((ex) => {
          const sideOrder = { left: 0, both: 0, right: 1 } as const;
          const sets = [...ex.sets].sort(
            (a, b) => a.set_number - b.set_number || sideOrder[a.side] - sideOrder[b.side],
          );
          return (
            <Card key={ex.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  {ex.exercises?.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {sets.map((set) => (
                  <span
                    key={set.id}
                    className="rounded-lg border bg-surface px-2.5 py-1.5 text-sm tabular-nums"
                  >
                    <span className="text-muted-foreground">
                      S{set.set_number}
                      {set.side !== "both" ? ` ${set.side === "left" ? "I" : "D"}` : ""}
                    </span>{" "}
                    <span className="font-semibold">{set.weight_kg ?? "BW"} kg × {set.reps ?? "-"}</span>
                    {set.rir !== null ? (
                      <span className="text-muted-foreground"> · RIR {set.rir}</span>
                    ) : null}
                  </span>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
