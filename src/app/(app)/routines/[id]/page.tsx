import { notFound } from "next/navigation";
import { Trash2, Moon } from "lucide-react";
import { getTemplate } from "@/lib/services/routines";
import { listExercises, listMuscleGroups } from "@/lib/services/exercises";
import { deleteDayAction } from "@/lib/actions/routines";
import { TemplateDayExercises } from "@/components/routines/template-day-exercises";
import { AddDayCard } from "@/components/routines/add-day-card";
import { RenameTemplateDialog } from "@/components/routines/rename-template-dialog";
import { EditDayDialog } from "@/components/routines/edit-day-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <BackButton fallbackHref="/routines" />
      <div className="flex items-start justify-between gap-2 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
          {template.description && (
            <p className="mt-1 text-muted-foreground">{template.description}</p>
          )}
        </div>
        <RenameTemplateDialog
          templateId={template.id}
          name={template.name}
          description={template.description}
        />
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
              <div className="flex shrink-0 items-center gap-0.5">
                <EditDayDialog day={day} templateId={template.id} muscleGroups={muscleGroups} />
                <form action={deleteDayAction.bind(null, day.id, template.id)}>
                  <ConfirmSubmitButton
                    confirmMessage={`¿Eliminar el día "${day.name}"? No se puede deshacer.`}
                    variant="ghost"
                    size="icon-sm"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </ConfirmSubmitButton>
                </form>
              </div>
            </CardHeader>
            {!day.is_rest_day && (
              <CardContent>
                <TemplateDayExercises
                  dayId={day.id}
                  templateId={template.id}
                  dayExercises={day.workout_template_exercises ?? []}
                  exercises={exercises}
                />
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <AddDayCard templateId={template.id} muscleGroups={muscleGroups} />
    </div>
  );
}
