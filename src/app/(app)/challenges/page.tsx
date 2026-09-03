import { Swords } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listChallenges } from "@/lib/services/challenges";
import { listExercises } from "@/lib/services/exercises";
import { CreateChallengeDialog } from "@/components/challenges/create-challenge-dialog";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function ChallengesPage() {
  const profile = await requireProfile();
  const [challenges, exercises] = await Promise.all([
    listChallenges(profile.id),
    listExercises(),
  ]);

  const active = challenges.filter((c) => c.status !== "completed");
  const completed = challenges.filter((c) => c.status === "completed");
  const exerciseOptions = exercises.map((e) => ({ id: e.id, name: e.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Retos</h1>
        <CreateChallengeDialog exercises={exerciseOptions} />
      </div>

      {challenges.length === 0 ? (
        <Card className="fade-up [animation-delay:60ms]">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Swords className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Todavía no tienes ningún reto. Ponte uno con fecha límite.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-2 fade-up [animation-delay:60ms]">
              {active.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-2 fade-up [animation-delay:100ms]">
              <p className="stat-label">Completados</p>
              {completed.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
