import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listMyGroups } from "@/lib/services/groups";
import { CreateGroupDialog } from "@/components/groups/create-group-dialog";
import { Card, CardContent } from "@/components/ui/card";

export default async function GroupsPage() {
  const profile = await requireProfile();
  const groups = await listMyGroups(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Grupos</h1>
        <CreateGroupDialog />
      </div>

      {groups.length === 0 ? (
        <Card className="fade-up [animation-delay:60ms]">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              Todavía no tienes ningún grupo. Crea uno para entrenar con amigos.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 fade-up [animation-delay:60ms]">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="card-interactive flex items-center gap-3 rounded-xl border bg-card p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{group.name}</p>
                <p className="text-sm text-muted-foreground">
                  {group.memberCount} miembro{group.memberCount === 1 ? "" : "s"}
                  {group.role === "owner" ? " · Tú eres el admin" : ""}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
