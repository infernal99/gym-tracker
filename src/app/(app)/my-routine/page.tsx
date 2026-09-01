import Link from "next/link";
import { Star, Moon } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getTemplate } from "@/lib/services/routines";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MyRoutinePage() {
  const profile = await requireProfile();
  const template = profile.active_template_id
    ? await getTemplate(profile.active_template_id)
    : null;

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
          return (
            <Card key={day.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {day.name}
                  {day.is_rest_day && (
                    <Badge variant="secondary" className="gap-1">
                      <Moon className="h-3 w-3" />
                      Descanso
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              {!day.is_rest_day && (
                <CardContent>
                  <details>
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      {dayExercises.length} ejercicios
                    </summary>
                    <div className="mt-3 space-y-2">
                      {dayExercises.map((ex) => (
                        <div key={ex.id} className="rounded-md border px-3 py-2">
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
                    </div>
                  </details>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <Button render={<Link href={`/routines/${template.id}`} />} variant="outline" className="w-full">
        Ver y editar rutina completa
      </Button>
    </div>
  );
}
