import { notFound } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Flame, TrendingUp, Trophy } from "lucide-react";
import {
  getExerciseBySlug,
  listFavoriteExerciseIds,
  getExerciseNote,
  listExercisesByIds,
} from "@/lib/services/exercises";
import { getExerciseProgress } from "@/lib/services/training";
import { requireProfile } from "@/lib/services/profile";
import { muscleBadgeClass } from "@/lib/muscle-colors";
import { saveExerciseNoteAction } from "@/lib/actions/exercises";
import { ExerciseChart } from "@/components/exercises/exercise-chart";
import { FavoriteButton } from "@/components/exercises/favorite-button";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const movementTypeLabels: Record<string, string> = {
  compound: "Compuesto",
  isolation: "Aislado",
  cardio: "Cardio",
  mobility: "Movilidad",
};

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireProfile();
  const exercise = await getExerciseBySlug(slug);
  if (!exercise) notFound();

  const [{ points, personalRecords, weekOverWeek }, favoriteIds, note, alternatives] =
    await Promise.all([
      getExerciseProgress(profile.id, exercise.id),
      listFavoriteExerciseIds(profile.id),
      getExerciseNote(profile.id, exercise.id),
      listExercisesByIds(exercise.alternative_exercise_ids),
    ]);

  const isFavorite = favoriteIds.has(exercise.id);
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
      {exercise.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={exercise.image_url}
          alt={exercise.name}
          className="aspect-video w-full rounded-xl border object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-3 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{exercise.name}</h1>
          {exercise.alternate_names?.[0] && (
            <p className="text-sm text-muted-foreground">{exercise.alternate_names[0]}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {exercise.muscle_groups && (
              <Badge className={muscleBadgeClass(exercise.muscle_groups.slug)}>
                {exercise.muscle_groups.name}
              </Badge>
            )}
            {exercise.equipment && <Badge variant="outline">{exercise.equipment.name}</Badge>}
            <Badge variant="outline">{difficultyLabels[exercise.difficulty]}</Badge>
            <Badge variant="outline">{movementTypeLabels[exercise.movement_type]}</Badge>
          </div>
          {exercise.description && (
            <p className="mt-2 text-sm text-muted-foreground">{exercise.description}</p>
          )}
        </div>
        <FavoriteButton exerciseId={exercise.id} isFavorite={isFavorite} />
      </div>

      {points.length === 0 ? (
        <Card className="fade-up [animation-delay:60ms]">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Todavía no has registrado este ejercicio en ningún entrenamiento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 fade-up [animation-delay:60ms]">
          <p className="stat-label">Mi progreso</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatTile
              icon={Trophy}
              label="PR peso"
              value={bestWeightPR ? `${bestWeightPR.weight_kg} kg` : "—"}
            />
            <StatTile
              icon={Flame}
              label="1RM estimado"
              value={best1rmPR ? `${Math.round(best1rmPR.value)} kg` : "—"}
            />
            <StatTile icon={Dumbbell} label="Sesiones" value={points.length} />
            <StatTile
              icon={TrendingUp}
              label="Volumen total"
              value={`${Math.round(totalVolume)} kg`}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Evolución</CardTitle>
            </CardHeader>
            <CardContent>
              <ExerciseChart points={points} />
            </CardContent>
          </Card>

          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-4 text-sm">
              <p className="stat-label mb-1.5">Esta semana vs la anterior</p>
              {weekOverWeek.bestThisWeek === null ? (
                <p className="text-muted-foreground">No has entrenado esto esta semana.</p>
              ) : weekOverWeek.bestLastWeek === null ? (
                <p>
                  Mejor 1RM esta semana:{" "}
                  <span className="font-semibold tabular-nums">{weekOverWeek.bestThisWeek} kg</span>
                </p>
              ) : (
                <p className="tabular-nums">
                  {weekOverWeek.bestThisWeek} kg vs {weekOverWeek.bestLastWeek} kg ·{" "}
                  <span
                    className={`font-semibold ${(weekOverWeek.changePct ?? 0) >= 0 ? "text-success" : "text-muted-foreground"}`}
                  >
                    {(weekOverWeek.changePct ?? 0) >= 0 ? "+" : ""}
                    {weekOverWeek.changePct?.toFixed(1)}%
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-xl border bg-card p-4 text-sm">
              <p className="stat-label mb-1.5">Desde tu primer registro</p>
              {points.length < 2 ? (
                <p className="text-muted-foreground">Solo hay una sesión registrada todavía.</p>
              ) : (
                <p className="tabular-nums">
                  {first.weightKg} kg × {first.reps} →{" "}
                  <span className="font-semibold">
                    {latest.weightKg} kg × {latest.reps}
                  </span>{" "}
                  ·{" "}
                  <span
                    className={`font-semibold ${(weightChangeSinceFirst ?? 0) >= 0 ? "text-success" : "text-muted-foreground"}`}
                  >
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
            </div>
          </div>

          <Card className="py-0">
            <CardHeader className="pt-5">
              <CardTitle className="text-base">Historial</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              {[...points]
                .reverse()
                .slice(0, 10)
                .map((p, i) => (
                  <div
                    key={`${p.date}-${i}`}
                    className="flex items-center justify-between px-4 py-2.5 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {new Date(p.date).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    <span className="font-medium tabular-nums">
                      {p.weightKg} kg × {p.reps}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      )}

      {(exercise.instructions?.length ||
        exercise.tips?.length ||
        exercise.common_mistakes?.length) && (
        <Card className="fade-up [animation-delay:100ms]">
          <CardHeader>
            <CardTitle className="text-base">Técnica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {exercise.instructions && exercise.instructions.length > 0 && (
              <div>
                <p className="mb-1 font-medium">Cómo hacerlo</p>
                <ol className="list-decimal space-y-1 pl-4">
                  {exercise.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {exercise.tips && exercise.tips.length > 0 && (
              <div>
                <p className="mb-1 font-medium">Consejos</p>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {exercise.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
              <div>
                <p className="mb-1 font-medium">Errores comunes</p>
                <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                  {exercise.common_mistakes.map((mistake, i) => (
                    <li key={i}>{mistake}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {alternatives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ejercicios similares</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {alternatives.map((alt) => (
              <Link
                key={alt.id}
                href={`/exercises/${alt.slug}`}
                className="card-interactive rounded-full border bg-card px-3 py-1.5 text-sm"
              >
                {alt.name}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mi nota</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveExerciseNoteAction.bind(null, exercise.id)} className="space-y-2">
            <Textarea
              name="note"
              rows={2}
              maxLength={500}
              defaultValue={note}
              placeholder="Ej: me resulta más cómodo con agarre estrecho..."
            />
            <Button type="submit" size="sm">
              Guardar nota
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
