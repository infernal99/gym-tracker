import Link from "next/link";
import { Star, Moon, ChevronDown, Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getTemplate, listWeekdaySlots } from "@/lib/services/routines";
import { getNextDayInSequence } from "@/lib/services/training";
import { listExercises } from "@/lib/services/exercises";
import { deleteDayAction } from "@/lib/actions/routines";
import { TemplateDayExercises } from "@/components/routines/template-day-exercises";
import { AddDayCard } from "@/components/routines/add-day-card";
import { RenameTemplateDialog } from "@/components/routines/rename-template-dialog";
import { WeeklyCalendar } from "@/components/routines/weekly-calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MyRoutinePage() {
  const profile = await requireProfile();
  const [template, sequence, exercises, weekdaySlots] = await Promise.all([
    profile.active_template_id ? getTemplate(profile.active_template_id) : Promise.resolve(null),
    profile.active_template_id
      ? getNextDayInSequence(profile.id, profile.active_template_id)
      : Promise.resolve({ day: null, nextTrainingDay: null }),
    listExercises(),
    profile.active_template_id
      ? listWeekdaySlots(profile.active_template_id)
      : Promise.resolve([]),
  ]);

  if (!template) {
    return (
      <Card className="fade-up">
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Star className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">Todavía no tienes ninguna rutina activa.</p>
          <Button render={<Link href="/my-routine/choose" />}>Elegir rutina</Button>
        </CardContent>
      </Card>
    );
  }

  const days = [...(template.workout_template_days ?? [])].sort(
    (a, b) => a.day_order - b.day_order,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2 fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
          {template.description && (
            <p className="mt-1 text-muted-foreground">{template.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <RenameTemplateDialog
            templateId={template.id}
            name={template.name}
            description={template.description}
          />
          <Button render={<Link href="/my-routine/choose" />} variant="outline" size="sm">
            Cambiar rutina
          </Button>
        </div>
      </div>

      <WeeklyCalendar
        templateId={template.id}
        trainingDays={days.filter((d) => !d.is_rest_day)}
        slots={weekdaySlots}
      />

      <div className="grid gap-3 fade-up [animation-delay:100ms]">
        {days.map((day) => {
          const dayExercises = [...(day.workout_template_exercises ?? [])].sort(
            (a, b) => a.order_index - b.order_index,
          );
          const isSuggested = sequence.day?.id === day.id;
          if (day.is_rest_day) {
            return (
              <Card key={day.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {day.name}
                    <Badge variant="secondary" className="gap-1">
                      <Moon className="h-3 w-3" />
                      Descanso
                    </Badge>
                  </CardTitle>
                  <form action={deleteDayAction.bind(null, day.id, template.id)}>
                    <Button type="submit" variant="ghost" size="icon-sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </form>
                </CardHeader>
              </Card>
            );
          }

          return (
            <div
              key={day.id}
              className={`overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 [--card-spacing:--spacing(4)] ${
                isSuggested ? "ring-primary/40" : "ring-foreground/10"
              }`}
            >
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-(--card-spacing) transition-colors duration-fast hover:bg-accent/40 [&::-webkit-details-marker]:hidden">
                  <span className="font-heading text-base font-semibold">{day.name}</span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {dayExercises.length} ejercicios
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="space-y-3 px-(--card-spacing) pb-(--card-spacing)">
                  <TemplateDayExercises
                    dayId={day.id}
                    templateId={template.id}
                    dayExercises={dayExercises}
                    exercises={exercises}
                  />
                  <form action={deleteDayAction.bind(null, day.id, template.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar día
                    </Button>
                  </form>
                </div>
              </details>
            </div>
          );
        })}
      </div>

      <AddDayCard templateId={template.id} />
    </div>
  );
}
