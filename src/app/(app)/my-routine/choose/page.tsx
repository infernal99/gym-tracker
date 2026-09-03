import Link from "next/link";
import { ListChecks } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listMyTemplates } from "@/lib/services/routines";
import { setActiveTemplateAction } from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChooseActiveRoutinePage() {
  const profile = await requireProfile();
  const templates = await listMyTemplates(profile.id);

  return (
    <div className="space-y-6">
      <div className="fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Elegir rutina</h1>
        <p className="mt-1 text-muted-foreground">
          Marca cuál de tus rutinas es la que estás siguiendo ahora mismo.
        </p>
      </div>

      {templates.length === 0 ? (
        <Card className="fade-up [animation-delay:60ms]">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Todavía no has creado ninguna rutina.</p>
            <Button render={<Link href="/routines/new" />}>Crear rutina</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 fade-up [animation-delay:60ms] sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="card-interactive">
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
                <p className="stat-label">
                  {template.workout_template_days?.length ?? 0} días
                </p>
              </CardHeader>
              <CardContent>
                <form action={setActiveTemplateAction.bind(null, template.id)}>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full"
                    variant={template.id === profile.active_template_id ? "secondary" : "default"}
                  >
                    {template.id === profile.active_template_id ? "Activa" : "Seleccionar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
