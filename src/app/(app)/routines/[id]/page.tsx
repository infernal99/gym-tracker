import { notFound } from "next/navigation";
import { Plus, Trash2, Moon } from "lucide-react";
import { getTemplate } from "@/lib/services/routines";
import { listExercises, listMuscleGroups } from "@/lib/services/exercises";
import {
  addDayAction,
  deleteDayAction,
  addTemplateExerciseAction,
  removeTemplateExerciseAction,
} from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function RoutineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, exercises, muscleGroups] = await Promise.all([
    getTemplate(id),
    listExercises(),
    listMuscleGroups(),
  ]);

  if (!template) notFound();

  const days = [...(template.workout_template_days ?? [])].sort(
    (a, b) => a.day_order - b.day_order,
  );

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
        {template.description && (
          <p className="mt-1 text-muted-foreground">{template.description}</p>
        )}
      </div>

      <div className="space-y-4 fade-up [animation-delay:60ms]">
        {days.map((day) => (
          <Card key={day.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  {day.name}
                  {day.is_rest_day && (
                    <Badge variant="secondary" className="gap-1">
                      <Moon className="h-3 w-3" />
                      Descanso
                    </Badge>
                  )}
                </CardTitle>
                {day.muscle_group_ids.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {day.muscle_group_ids.map((mgId) => {
                      const group = muscleGroups.find((g) => g.id === mgId);
                      return group ? (
                        <Badge key={mgId} variant="outline">
                          {group.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <form action={deleteDayAction.bind(null, day.id, template.id)}>
                <Button type="submit" variant="ghost" size="icon-sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </form>
            </CardHeader>
            {!day.is_rest_day && (
              <CardContent className="space-y-3">
                {[...(day.workout_template_exercises ?? [])]
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between rounded-xl border bg-surface px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{ex.exercises?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {ex.target_sets} series
                          {ex.target_reps_min && ex.target_reps_max
                            ? ` · ${ex.target_reps_min}-${ex.target_reps_max} reps`
                            : ""}
                          {ex.target_weight_kg ? ` · ${ex.target_weight_kg} kg` : ""}
                          {ex.target_rir !== null ? ` · RIR ${ex.target_rir}` : ""}
                          {` · ${ex.rest_seconds}s descanso`}
                        </p>
                      </div>
                      <form action={removeTemplateExerciseAction.bind(null, ex.id, template.id)}>
                        <Button type="submit" variant="ghost" size="icon-sm">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  ))}

                <details className="rounded-xl border px-3 py-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    + Añadir ejercicio
                  </summary>
                  <form
                    action={addTemplateExerciseAction.bind(null, day.id, template.id)}
                    className="mt-3 grid grid-cols-2 gap-2"
                  >
                    <div className="col-span-2 sm:col-span-4">
                      <Select name="exerciseId" required>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Ejercicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {exercises.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Series</Label>
                      <Input name="targetSets" type="number" min={1} defaultValue={3} required />
                    </div>
                    <div>
                      <Label className="text-xs">Reps min</Label>
                      <Input name="targetRepsMin" type="number" min={1} />
                    </div>
                    <div>
                      <Label className="text-xs">Reps max</Label>
                      <Input name="targetRepsMax" type="number" min={1} />
                    </div>
                    <div>
                      <Label className="text-xs">Peso (kg)</Label>
                      <Input name="targetWeightKg" type="number" step="0.5" min={0} />
                    </div>
                    <div>
                      <Label className="text-xs">RIR</Label>
                      <Input name="targetRir" type="number" min={0} max={10} />
                    </div>
                    <div>
                      <Label className="text-xs">Descanso (s)</Label>
                      <Input name="restSeconds" type="number" min={0} defaultValue={90} />
                    </div>
                    <div className="col-span-2 flex items-end sm:col-span-1">
                      <Button type="submit" size="sm" className="w-full">
                        <Plus className="h-3.5 w-3.5" />
                        Añadir
                      </Button>
                    </div>
                  </form>
                </details>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Añadir día</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={addDayAction.bind(null, template.id)}
            className="flex flex-col gap-2"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor="dayName" className="text-xs">
                Nombre
              </Label>
              <Input id="dayName" name="name" placeholder="Push" required />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" name="isRestDay" className="h-4 w-4" />
              Día de descanso
            </label>
            <Button type="submit">
              <Plus className="h-4 w-4" />
              Añadir día
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
