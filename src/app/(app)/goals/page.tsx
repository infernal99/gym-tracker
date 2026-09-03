import { Target } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listGoals } from "@/lib/services/goals";
import { listExercises } from "@/lib/services/exercises";
import { CreateGoalDialog } from "@/components/goals/create-goal-dialog";
import { GoalCard } from "@/components/goals/goal-card";
import { Card, CardContent } from "@/components/ui/card";

export default async function GoalsPage() {
  const profile = await requireProfile();
  const [goals, exercises] = await Promise.all([listGoals(profile.id), listExercises()]);

  const activeGoals = goals.filter((g) => g.status === "active" || g.status === "paused");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const exerciseOptions = exercises.map((e) => ({ id: e.id, name: e.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Objetivos</h1>
        <CreateGoalDialog exercises={exerciseOptions} />
      </div>

      {goals.length === 0 ? (
        <Card className="fade-up [animation-delay:60ms]">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Todavía no tienes ningún objetivo.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div className="space-y-2 fade-up [animation-delay:60ms]">
              {activeGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-2 fade-up [animation-delay:100ms]">
              <p className="stat-label">Completados</p>
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
