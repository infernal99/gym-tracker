import Link from "next/link";
import { Star, Moon, ChevronDown, Target } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getTemplate } from "@/lib/services/routines";
import { getNextDayInSequence } from "@/lib/services/training";
import { setSequenceAnchorAction } from "@/lib/actions/training";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MyRoutinePage() {
  const profile = await requireProfile();
  const [template, sequence] = await Promise.all([
    profile.active_template_id ? getTemplate(profile.active_template_id) : Promise.resolve(null),
    profile.active_template_id
      ? getNextDayInSequence(profile.id, profile.active_template_id)
      : Promise.resolve({ day: null, nextTrainingDay: null }),
  ]);

  if (!template) {
    return (
      <Card>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{template.name}</h1>
          {template.description && (
            <p className="mt-1 text-muted-foreground">{template.description}</p>
          )}
        </div>
        <Button render={<Link href="/my-routine/choose" />} variant="outline">
          Cambiar rutina
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {days.map((day) => {
          const dayExercises = [...(day.workout_template_exercises ?? [])].sort(
            (a, b) => a.order_index - b.order_index,
          );
          if (day.is_rest_day) {
            return (
              <Card key={day.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {day.name}
                    <Badge variant="secondary" className="gap-1">
                      <Moon className="h-3 w-3" />
                      Descanso
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>
            );
          }

          return (
            <div
              key={day.id}
              className="overflow-hidden rounded-xl bg-card text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)]"
            >
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-(--card-spacing) [&::-webkit-details-marker]:hidden">
                  <span className="font-heading text-base font-medium">{day.name}</span>
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {dayExercises.length} ejercicios
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                  </span>
                </summary>
                <div className="space-y-2 px-(--card-spacing) pb-(--card-spacing)">
                  {dayExercises.map((ex) => (
                    <div key={ex.id} className="rounded-xl border px-3 py-2">
                      <p className="text-sm font-medium">{ex.exercises?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.target_sets} series
                        {ex.target_reps_min && ex.target_reps_max
                          ? ` · ${ex.target_reps_min}-${ex.target_reps_max} reps`
                          : ""}
                        {ex.target_weight_kg ? ` · ${ex.target_weight_kg} kg` : ""}
                        {` · ${ex.rest_seconds}s descanso`}
                      </p>
                    </div>
                  ))}
                  {sequence.day?.id === day.id ? (
                    <p className="flex items-center gap-1.5 text-xs text-primary">
                      <Target className="h-3.5 w-3.5" />
                      Es tu próximo entrenamiento sugerido
                    </p>
                  ) : (
                    <form action={setSequenceAnchorAction.bind(null, day.id)}>
                      <Button type="submit" variant="ghost" size="sm" className="w-full">
                        <Target className="h-3.5 w-3.5" />
                        Ajustar mis entrenos a este día
                      </Button>
                    </form>
                  )}
                </div>
              </details>
            </div>
          );
        })}
      </div>

      <Button render={<Link href={`/routines/${template.id}`} />} variant="outline" className="w-full">
        Ver y editar rutina completa
      </Button>
    </div>
  );
}
