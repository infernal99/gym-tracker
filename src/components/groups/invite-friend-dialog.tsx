"use client";

import { UserPlus } from "lucide-react";
import { inviteFriendAction } from "@/lib/actions/groups";
import type { InviteCandidate } from "@/lib/services/groups";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Only friends who aren't already members show up here — the server already
// filtered the list, and RLS would refuse anyone else anyway.
export function InviteFriendDialog({
  groupId,
  candidates,
}: {
  groupId: string;
  candidates: InviteCandidate[];
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <UserPlus className="h-4 w-4" />
        Invitar
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar amigos</DialogTitle>
          <DialogDescription>
            Solo puedes añadir amigos que ya tengas agregados.
          </DialogDescription>
        </DialogHeader>
        {candidates.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tienes más amigos para añadir a este grupo.
          </p>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto">
            {candidates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl border bg-surface p-2.5">
                <Avatar className="h-9 w-9">
                  {c.avatarUrl && <AvatarImage src={c.avatarUrl} />}
                  <AvatarFallback>{c.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{c.username}</p>
                </div>
                <form action={inviteFriendAction.bind(null, groupId, c.id)}>
                  <Button type="submit" size="sm">
                    Añadir
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
