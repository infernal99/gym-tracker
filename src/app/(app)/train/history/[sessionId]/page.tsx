import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/services/profile";
import { getSessionWithDetails } from "@/lib/services/training";
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

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{session.name}</h1>
        <p className="text-muted-foreground">
          {session.completed_at &&
            new Date(session.completed_at).toLocaleDateString("es-ES", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          {session.duration_seconds ? ` · ${Math.round(session.duration_seconds / 60)} min` : ""}
          {` · ${session.total_volume_kg} kg`}
        </p>
      </div>

      <div className="space-y-3">
        {sessionExercises.map((ex) => {
          const sets = [...ex.sets].sort((a, b) => a.set_number - b.set_number);
          return (
            <Card key={ex.id}>
              <CardHeader>
                <CardTitle className="text-base">{ex.exercises?.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {sets.map((set) => (
                  <p key={set.id} className="text-sm text-muted-foreground">
                    Serie {set.set_number}: {set.weight_kg ?? "BW"} kg × {set.reps ?? "-"}
                    {set.rir !== null ? ` · RIR ${set.rir}` : ""}
                  </p>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
