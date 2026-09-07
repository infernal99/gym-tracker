import { Inbox } from "lucide-react";
import {
  acceptTemplateShareAction,
  dismissTemplateShareAction,
} from "@/lib/actions/routines";
import type { PendingTemplateShare } from "@/lib/services/routines";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Surfaces routines friends have sent on the home screen — sharing writes no
// notification of its own, so without this the only trace is a section on
// the Rutinas tab that you'd have to think to go look at.
export function SharedRoutineCard({ shares }: { shares: PendingTemplateShare[] }) {
  if (shares.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="stat-label flex items-center gap-1.5">
        <Inbox className="h-3.5 w-3.5" />
        Te han compartido una rutina
      </p>
      {shares.map((share) => (
        <Card key={share.id} className="fade-up overflow-hidden">
          <CardContent className="space-y-3 pt-5">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                {share.sharedBy.avatarUrl && <AvatarImage src={share.sharedBy.avatarUrl} />}
                <AvatarFallback>{share.sharedBy.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{share.templateName}</p>
                <p className="text-sm text-muted-foreground">
                  De {share.sharedBy.displayName}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Si la aceptas se copia a tus rutinas y podrás cambiarla a tu gusto.
            </p>
            <div className="flex gap-2">
              <form
                action={acceptTemplateShareAction.bind(null, share.id, share.shareToken)}
                className="flex-1"
              >
                <Button type="submit" className="w-full">
                  Aceptar
                </Button>
              </form>
              <form
                action={dismissTemplateShareAction.bind(null, share.id)}
                className="flex-1"
              >
                <Button type="submit" variant="outline" className="w-full">
                  Rechazar
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
