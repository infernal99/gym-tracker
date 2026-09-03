import { ListChecks, Sparkles } from "lucide-react";
import { listPublicTemplates } from "@/lib/services/routines";
import { createTemplateAction, useTemplateAction } from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewRoutinePage() {
  const templates = await listPublicTemplates();

  return (
    <div className="space-y-8">
      <div className="fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Nueva rutina</h1>
        <p className="mt-1 text-muted-foreground">
          Parte de una plantilla ya hecha o crea la tuya desde cero.
        </p>
      </div>

      <div className="space-y-3 fade-up [animation-delay:60ms]">
        <h2 className="stat-label flex items-center gap-2">
          <ListChecks className="h-3.5 w-3.5" />
          Plantillas
        </h2>
        <div className="grid gap-3">
          {templates.map((template) => (
            <Card key={template.id} className="card-interactive">
              <CardHeader>
                <CardTitle className="text-base">{template.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {(template.workout_template_days ?? [])
                    .map((day) => day.name)
                    .join(" · ")}
                </p>
                <form action={useTemplateAction.bind(null, template.id)}>
                  <Button type="submit" size="sm" className="w-full">
                    Usar esta plantilla
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3 fade-up [animation-delay:100ms]">
        <h2 className="stat-label flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Crear la mía
        </h2>
        <Card>
          <CardContent className="pt-6">
            <form action={createTemplateAction} className="flex flex-col gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" name="name" placeholder="Mi rutina" required />
              </div>
              <Button type="submit">Empezar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
