import Link from "next/link";
import { ListChecks, Plus, Copy, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listMyTemplates } from "@/lib/services/routines";
import {
  deleteTemplateAction,
  toggleArchiveTemplateAction,
  duplicateTemplateAction,
} from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RoutinesPage() {
  const profile = await requireProfile();
  const templates = await listMyTemplates(profile.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Rutinas</h1>
        <Button render={<Link href="/routines/new" />}>
          <Plus className="h-4 w-4" />
          Nueva rutina
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <ListChecks className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Tu progreso empieza aquí.</p>
            <Button render={<Link href="/routines/new" />}>
              <Plus className="h-4 w-4" />
              Nueva rutina
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="divide-y divide-border overflow-hidden py-0">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/routines/${template.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium hover:underline">{template.name}</p>
                  {template.is_public && (
                    <Badge variant="outline" className="shrink-0">
                      De serie
                    </Badge>
                  )}
                  {template.is_archived && (
                    <Badge variant="secondary" className="shrink-0">
                      Archivada
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {template.workout_template_days?.length ?? 0} días
                </p>
              </Link>
              <div className="flex shrink-0 items-center gap-0.5">
                <form action={duplicateTemplateAction.bind(null, template.id)}>
                  <Button type="submit" variant="ghost" size="icon-sm" title="Duplicar">
                    <Copy className="h-4 w-4" />
                  </Button>
                </form>
                {!template.is_public && (
                  <>
                    <form
                      action={toggleArchiveTemplateAction.bind(
                        null,
                        template.id,
                        !template.is_archived,
                      )}
                    >
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon-sm"
                        title={template.is_archived ? "Restaurar" : "Archivar"}
                      >
                        {template.is_archived ? (
                          <ArchiveRestore className="h-4 w-4" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                    <form action={deleteTemplateAction.bind(null, template.id)}>
                      <Button type="submit" variant="ghost" size="icon-sm" title="Eliminar">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
