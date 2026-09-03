import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Trash2, ArrowRight, Check, Moon, Copy } from "lucide-react";
import { getTemplate } from "@/lib/services/routines";
import { listMuscleGroups, listExercises } from "@/lib/services/exercises";
import { requireProfile } from "@/lib/services/profile";
import {
  addDayAction,
  removeTemplateExerciseAction,
  copyDayExercisesAction,
} from "@/lib/actions/routines";
import { ExercisePicker } from "@/components/routines/exercise-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RoutineSetupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { id } = await params;
  const { day: dayParam } = await searchParams;
  const profile = await requireProfile();
  const [template, muscleGroups, exercises] = await Promise.all([
    getTemplate(id),
    listMuscleGroups(),
    listExercises(),
  ]);

  if (!template) notFound();
  if (template.user_id !== profile.id) redirect(`/routines/${id}`);

  const days = [...(template.workout_template_days ?? [])].sort(
    (a, b) => a.day_order - b.day_order,
  );

  // La navegación entre días es explícita (vía ?day=), no automática:
  // al entrar sin día elegido, vamos siempre al primero.
  if (days.length > 0 && !dayParam) {
    redirect(`/routines/${id}/setup?day=${days[0].id}`);
  }

  const currentDay = dayParam ? (days.find((d) => d.id === dayParam) ?? days[0]) : undefined;
  const currentIndex = currentDay ? days.findIndex((d) => d.id === currentDay.id) : -1;
  const nextDay = currentIndex >= 0 ? days[currentIndex + 1] : undefined;
  const isLastDay = currentDay ? !nextDay : false;

  // Días anteriores con el mismo nombre (p. ej. "Pecho y Espalda" que se
  // repite en un split), para ofrecer copiar sus ejercicios de partida.
  const repeatedDay =
    currentDay && (currentDay.workout_template_exercises?.length ?? 0) === 0
      ? days.find(
          (d) =>
            d.id !== currentDay.id &&
            d.day_order < currentDay.day_order &&
            d.name === currentDay.name &&
            (d.workout_template_exercises?.length ?? 0) > 0,
        )
      : undefined;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="fade-up">
        <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {currentDay
            ? `${currentDay.name}: añade los ejercicios que vas a entrenar.`
            : "Empieza creando tu primer día de entrenamiento."}
        </p>
      </div>

      {days.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {days.map((day) => (
            <Link key={day.id} href={`/routines/${template.id}/setup?day=${day.id}`}>
              <Badge variant={day.id === currentDay?.id ? "default" : "secondary"}>
                {day.is_rest_day ? (
                  <Moon className="h-3 w-3" />
                ) : (day.workout_template_exercises?.length ?? 0) > 0 ? (
                  <Check className="h-3 w-3" />
                ) : null}
                {day.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {currentDay && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{currentDay.name}</CardTitle>
            {currentDay.muscle_group_ids.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentDay.muscle_group_ids.map((mgId) => {
                  const group = muscleGroups.find((g) => g.id === mgId);
                  return group ? (
                    <Badge key={mgId} variant="outline">
                      {group.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {[...(currentDay.workout_template_exercises ?? [])]
              .sort((a, b) => a.order_index - b.order_index)
              .map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-xl border bg-surface px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{ex.exercises?.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.target_sets} series</p>
                  </div>
                  <form action={removeTemplateExerciseAction.bind(null, ex.id, template.id)}>
                    <Button type="submit" variant="ghost" size="icon-sm">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </form>
                </div>
              ))}

            {repeatedDay && (
              <form
                action={copyDayExercisesAction.bind(null, repeatedDay.id, currentDay.id, template.id)}
              >
                <Button type="submit" variant="outline" size="sm" className="w-full">
                  <Copy className="h-3.5 w-3.5" />
                  Usar los mismos ejercicios que &quot;{repeatedDay.name}&quot;
                </Button>
              </form>
            )}

            <ExercisePicker dayId={currentDay.id} templateId={template.id} exercises={exercises} />
          </CardContent>
        </Card>
      )}

      {currentDay && nextDay && (
        <Button
          render={<Link href={`/routines/${template.id}/setup?day=${nextDay.id}`} />}
          className="w-full"
        >
          <ArrowRight className="h-4 w-4" />
          Pasar al siguiente día ({nextDay.name})
        </Button>
      )}

      {(!currentDay || isLastDay) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {currentDay ? "Añadir siguiente día" : "Crea tu primer día"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addDayAction.bind(null, template.id)} className="space-y-3">
              <input type="hidden" name="fromSetup" value="1" />
              <div className="space-y-1">
                <Label htmlFor="dayName" className="text-xs">
                  Nombre del día
                </Label>
                <Input id="dayName" name="name" placeholder="Pecho y espalda" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">¿Qué músculos entrenas este día?</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border p-3">
                  {muscleGroups.map((group) => (
                    <label key={group.id} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        name="muscleGroupIds"
                        value={group.id}
                        className="h-4 w-4"
                      />
                      {group.name}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                <ArrowRight className="h-4 w-4" />
                Crear día
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {days.length > 0 && (
        <Button
          render={<Link href={`/routines/${template.id}`} />}
          variant="outline"
          className="w-full"
        >
          Terminar rutina
        </Button>
      )}
    </div>
  );
}
