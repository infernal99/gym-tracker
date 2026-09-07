import Link from "next/link";
import { Inbox } from "lucide-react";
import {
  acceptTemplateShareAction,
  dismissTemplateShareAction,
} from "@/lib/actions/routines";
import type { PendingTemplateShare } from "@/lib/services/routines";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Shown on both the home screen and the Rutinas tab, deliberately the same
// in both places: sharing writes no notification of its own, so the home
// screen is where you actually find out, but it should still be waiting on
// the Rutinas tab if that's where you go looking for it.
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
                {/* Links to the preview so you can check what's in it
                    before deciding. */}
                <Link
                  href={`/routines/shared/${share.shareToken}`}
                  className="block truncate font-semibold underline-offset-2 hover:underline"
                >
                  {share.templateName}
                </Link>
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
