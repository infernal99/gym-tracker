import { notFound, redirect } from "next/navigation";
import { Sparkles, Trash2, Moon } from "lucide-react";
import { getTemplate, findUserFork } from "@/lib/services/routines";
import { listExercises, listMuscleGroups } from "@/lib/services/exercises";
import { requireProfile } from "@/lib/services/profile";
import { deleteDayAction, personalizeTemplateAction } from "@/lib/actions/routines";
import { TemplateDayExercises } from "@/components/routines/template-day-exercises";
import { AddDayCard } from "@/components/routines/add-day-card";
import { RenameTemplateDialog } from "@/components/routines/rename-template-dialog";
import { EditDayDialog } from "@/components/routines/edit-day-dialog";
import { ResetTemplateButton } from "@/components/routines/reset-template-button";
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
  const profile = await requireProfile();
  const [template, exercises, muscleGroups] = await Promise.all([
    getTemplate(id),
    listExercises(),
    listMuscleGroups(),
  ]);

  if (!template) notFound();

  // A "De serie" template has to look the same to everyone, so nobody edits
  // the shared row directly — they get routed to their own personal copy
  // instead (created on demand the first time they tap "Personalizar").
  const isOwner = template.user_id === profile.id;
  if (template.is_public && !isOwner) {
    const existingFork = await findUserFork(profile.id, template.id);
    if (existingFork) redirect(`/routines/${existingFork.id}`);
  }
  const readOnly = template.is_public;

  const days = [...(template.workout_template_days ?? [])].sort(
    (a, b) => a.day_order - b.day_order,
  );

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/routines" />
      <div className="flex items-start justify-between gap-2 fade-up">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
            {template.is_public && (
              <Badge variant="outline" className="shrink-0">
                De serie
              </Badge>
            )}
          </div>
          {template.description && (
            <p className="mt-1 text-muted-foreground">{template.description}</p>
          )}
        </div>
        {readOnly ? (
          <form action={personalizeTemplateAction.bind(null, template.id)}>
            <Button type="submit" size="sm">
              <Sparkles className="h-3.5 w-3.5" />
              Personalizar
            </Button>
          </form>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            {template.forked_from_id && <ResetTemplateButton templateId={template.id} />}
            <RenameTemplateDialog
              templateId={template.id}
              name={template.name}
              description={template.description}
            />
          </div>
        )}
      </div>

      {readOnly && (
        <p className="text-sm text-muted-foreground fade-up [animation-delay:40ms]">
          Esta es una rutina de serie: se ve igual para todo el mundo. Pulsa &quot;Personalizar&quot;
          para tener tu propia copia editable.
        </p>
      )}

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
              {!readOnly && (
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
              )}
            </CardHeader>
            {!day.is_rest_day && (
              <CardContent>
                {readOnly ? (
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {[...(day.workout_template_exercises ?? [])]
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((ex) => (
                        <li key={ex.id}>
                          {ex.exercises?.name} · {ex.target_sets} series
                        </li>
                      ))}
                  </ul>
                ) : (
                  <TemplateDayExercises
                    dayId={day.id}
                    templateId={template.id}
                    dayExercises={day.workout_template_exercises ?? []}
                    exercises={exercises}
                    dayMuscleGroupIds={day.muscle_group_ids}
                  />
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {!readOnly && <AddDayCard templateId={template.id} muscleGroups={muscleGroups} />}
    </div>
  );
}
