import Link from "next/link";
import { History } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listCompletedSessions } from "@/lib/services/training";
import { Card, CardContent } from "@/components/ui/card";

export default async function TrainHistoryPage() {
  const profile = await requireProfile();
  const sessions = await listCompletedSessions(profile.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <History className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Aún no has completado ningún entrenamiento.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link key={session.id} href={`/train/history/${session.id}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="space-y-1 pt-6">
                  <p className="text-xs text-muted-foreground">
                    {new Date(session.completed_at!).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="font-medium">{session.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {session.duration_seconds
                      ? `${Math.round(session.duration_seconds / 60)}min · `
                      : ""}
                    {session.workout_session_exercises?.length ?? 0} ejercicios ·{" "}
                    {session.total_volume_kg} kg
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
