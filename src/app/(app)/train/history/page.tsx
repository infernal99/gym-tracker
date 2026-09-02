import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listCompletedSessions } from "@/lib/services/training";
import { Card, CardContent } from "@/components/ui/card";

export default async function TrainHistoryPage() {
  const profile = await requireProfile();
  const sessions = await listCompletedSessions(profile.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Historial</h1>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <History className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Aún no has completado ningún entrenamiento.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden py-0">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/train/history/${session.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {new Date(session.completed_at!).toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="mt-0.5 truncate font-medium">{session.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {session.duration_seconds
                    ? `${Math.round(session.duration_seconds / 60)}min · `
                    : ""}
                  {session.workout_session_exercises?.length ?? 0} ejercicios ·{" "}
                  {session.total_volume_kg} kg
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
