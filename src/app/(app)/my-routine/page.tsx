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
        {days.map((day) => (
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
                <p className="text-sm text-muted-foreground">
                  {(day.workout_template_exercises?.length ?? 0)} ejercicios
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Button render={<Link href={`/routines/${template.id}`} />} variant="outline" className="w-full">
        Ver y editar rutina completa
      </Button>
    </div>
  );
}
