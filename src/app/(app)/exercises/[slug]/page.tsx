import { notFound } from "next/navigation";
import { Dumbbell, Flame, TrendingUp, Trophy } from "lucide-react";
import { getExerciseBySlug } from "@/lib/services/exercises";
import { getExerciseProgress } from "@/lib/services/training";
import { requireProfile } from "@/lib/services/profile";
import { ExerciseChart } from "@/components/exercises/exercise-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-semibold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireProfile();
  const exercise = await getExerciseBySlug(slug);
  if (!exercise) notFound();

  const { points, personalRecords, weekOverWeek } = await getExerciseProgress(
    profile.id,
    exercise.id,
  );

  const bestWeightPR = personalRecords.find((pr) => pr.record_type === "max_weight");
  const best1rmPR = personalRecords.find((pr) => pr.record_type === "best_1rm");
  const totalVolume = points.reduce((sum, p) => sum + p.volumeKg, 0);

  const first = points[0];
  const latest = points[points.length - 1];
  const weightChangeSinceFirst = points.length > 1 ? latest.weightKg - first.weightKg : null;
  const e1rmChangePctSinceFirst =
    points.length > 1 && first.e1rm > 0 ? ((latest.e1rm - first.e1rm) / first.e1rm) * 100 : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{exercise.name}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {exercise.muscle_groups && <Badge variant="secondary">{exercise.muscle_groups.name}</Badge>}
          {exercise.equipment && <Badge variant="outline">{exercise.equipment.name}</Badge>}
          <Badge variant="outline">{difficultyLabels[exercise.difficulty]}</Badge>
        </div>
        {exercise.description && (
          <p className="mt-2 text-sm text-muted-foreground">{exercise.description}</p>
        )}
      </div>

      {points.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Todavía no has registrado este ejercicio en ningún entrenamiento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Trophy}
              label="PR peso"
              value={bestWeightPR ? `${bestWeightPR.weight_kg} kg` : "—"}
            />
            <StatCard
              icon={Flame}
              label="1RM estimado"
              value={best1rmPR ? `${Math.round(best1rmPR.value)} kg` : "—"}
            />
            <StatCard icon={Dumbbell} label="Sesiones" value={points.length} />
            <StatCard icon={TrendingUp} label="Volumen total" value={`${Math.round(totalVolume)} kg`} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <ExerciseChart points={points} />
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Esta semana vs la anterior</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {weekOverWeek.bestThisWeek === null ? (
                  <p className="text-muted-foreground">No has entrenado esto esta semana.</p>
                ) : weekOverWeek.bestLastWeek === null ? (
                  <p className="text-muted-foreground">
                    Mejor 1RM esta semana: {weekOverWeek.bestThisWeek} kg (sin datos de la semana
                    anterior para comparar).
                  </p>
                ) : (
                  <p>
                    {weekOverWeek.bestThisWeek} kg vs {weekOverWeek.bestLastWeek} kg ·{" "}
                    <span
                      className={
                        (weekOverWeek.changePct ?? 0) >= 0 ? "text-primary" : "text-muted-foreground"
                      }
                    >
                      {(weekOverWeek.changePct ?? 0) >= 0 ? "+" : ""}
                      {weekOverWeek.changePct?.toFixed(1)}%
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Desde tu primer registro</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                {points.length < 2 ? (
                  <p className="text-muted-foreground">
                    Solo hay una sesión registrada todavía.
                  </p>
                ) : (
                  <p>
                    {first.weightKg} kg × {first.reps} ({new Date(first.date).toLocaleDateString("es-ES")}) →{" "}
                    {latest.weightKg} kg × {latest.reps} ·{" "}
                    <span className={(weightChangeSinceFirst ?? 0) >= 0 ? "text-primary" : "text-muted-foreground"}>
                      {(weightChangeSinceFirst ?? 0) >= 0 ? "+" : ""}
                      {weightChangeSinceFirst} kg
                    </span>
                    {e1rmChangePctSinceFirst !== null && (
                      <>
                        {" "}
                        (1RM {e1rmChangePctSinceFirst >= 0 ? "+" : ""}
                        {e1rmChangePctSinceFirst.toFixed(1)}%)
                      </>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimas sesiones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[...points]
                .reverse()
                .slice(0, 10)
                .map((p, i) => (
                  <div
                    key={`${p.date}-${i}`}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("es-ES")}
                    </span>
                    <span className="font-medium">
                      {p.weightKg} kg × {p.reps}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
