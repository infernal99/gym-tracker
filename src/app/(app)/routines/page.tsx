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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RoutinesPage() {
  const profile = await requireProfile();
  const templates = await listMyTemplates(profile.id);

  return (
    <div className="space-y-6">
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">
                    <Link href={`/routines/${template.id}`} className="hover:underline">
                      {template.name}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.workout_template_days?.length ?? 0} días
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {template.is_public && <Badge variant="outline">De serie</Badge>}
                  {template.is_archived && <Badge variant="secondary">Archivada</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-1">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
