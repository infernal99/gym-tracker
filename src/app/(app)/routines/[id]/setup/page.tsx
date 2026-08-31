import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Trash2, ArrowRight, Check } from "lucide-react";
import { getTemplate } from "@/lib/services/routines";
import { listMuscleGroups, listExercises } from "@/lib/services/exercises";
import { requireProfile } from "@/lib/services/profile";
import { addDayAction, removeTemplateExerciseAction } from "@/lib/actions/routines";
import { ExercisePicker } from "@/components/routines/exercise-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RoutineSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  const currentDay = days[days.length - 1];

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{template.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {currentDay
            ? `Día ${days.length}: añade los ejercicios que vas a entrenar.`
            : "Empieza creando tu primer día de entrenamiento."}
        </p>
      </div>

      {days.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {days.slice(0, -1).map((day) => (
            <Badge key={day.id} variant="secondary">
              <Check className="h-3 w-3" />
              {day.name}
            </Badge>
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
                  className="flex items-center justify-between rounded-md border px-3 py-2"
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

            <ExercisePicker dayId={currentDay.id} templateId={template.id} exercises={exercises} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {currentDay ? "Añadir siguiente día" : "Crea tu primer día"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addDayAction.bind(null, template.id)} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="dayName" className="text-xs">
                Nombre del día
              </Label>
              <Input id="dayName" name="name" placeholder="Pecho y espalda" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">¿Qué músculos entrenas este día?</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border p-3">
                {muscleGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" name="muscleGroupIds" value={group.id} className="h-4 w-4" />
                    {group.name}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full">
              <ArrowRight className="h-4 w-4" />
              {currentDay ? "Guardar y pasar al siguiente día" : "Crear día"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {currentDay && (
        <Button render={<Link href={`/routines/${template.id}`} />} variant="outline" className="w-full">
          Terminar rutina
        </Button>
      )}
    </div>
  );
}
