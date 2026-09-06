import { Swords } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listChallenges } from "@/lib/services/challenges";
import { listDuels } from "@/lib/services/duels";
import { listExercises } from "@/lib/services/exercises";
import { getFriendsWithStats } from "@/lib/services/friends";
import { CreateChallengeDialog } from "@/components/challenges/create-challenge-dialog";
import { CreateDuelDialog } from "@/components/challenges/create-duel-dialog";
import { ChallengeCard } from "@/components/challenges/challenge-card";
import { DuelCard } from "@/components/challenges/duel-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function ChallengesPage() {
  const profile = await requireProfile();
  const [challenges, duels, exercises, friends] = await Promise.all([
    listChallenges(profile.id),
    listDuels(profile.id),
    listExercises(),
    getFriendsWithStats(profile.id),
  ]);

  const active = challenges.filter((c) => c.status !== "completed");
  const completed = challenges.filter((c) => c.status === "completed");
  const activeDuels = duels.filter((d) => !d.finished);
  const finishedDuels = duels.filter((d) => d.finished);
  const exerciseOptions = exercises.map((e) => ({ id: e.id, name: e.name }));
  const friendOptions = friends
    .filter((f) => !f.isMe)
    .map((f) => ({ id: f.id, displayName: f.displayName, username: f.username }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Retos</h1>
        <div className="flex gap-2">
          <CreateDuelDialog friends={friendOptions} exercises={exerciseOptions} />
          <CreateChallengeDialog exercises={exerciseOptions} />
        </div>
      </div>

      {activeDuels.length > 0 && (
        <div className="space-y-2 fade-up [animation-delay:40ms]">
          <p className="stat-label">Duelos</p>
          {activeDuels.map((d) => (
            <DuelCard key={d.id} duel={d} />
          ))}
        </div>
      )}

      {challenges.length === 0 && duels.length === 0 ? (
        <Card className="fade-up [animation-delay:60ms]">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Swords className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Todavía no tienes ningún reto. Ponte uno con fecha límite o reta a un amigo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div className="space-y-2 fade-up [animation-delay:60ms]">
              {duels.length > 0 && <p className="stat-label">Retos personales</p>}
              {active.map((c) => (
                <ChallengeCard key={c.id} challenge={c} />
              ))}
            </div>
          )}

          {(completed.length > 0 || finishedDuels.length > 0) && (
            <div className="space-y-2 fade-up [animation-delay:100ms]">
              <p className="stat-label">Completados</p>
              {finishedDuels.map((d) => (
                <DuelCard key={d.id} duel={d} />
              ))}
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
