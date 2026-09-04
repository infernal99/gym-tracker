"use client";

import { useState } from "react";
import { Share2, Link2, Check } from "lucide-react";
import { toast } from "sonner";
import { getOrCreateShareTokenAction, shareTemplateWithFriendAction } from "@/lib/actions/routines";
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

interface ShareCandidate {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export function ShareRoutineDialog({
  templateId,
  candidates,
}: {
  templateId: string;
  candidates: ShareCandidate[];
}) {
  const [copying, setCopying] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  async function copyLink() {
    setCopying(true);
    try {
      const token = await getOrCreateShareTokenAction(templateId);
      if (!token) {
        toast.error("No se pudo generar el enlace");
        return;
      }
      await navigator.clipboard.writeText(`${window.location.origin}/routines/shared/${token}`);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    } finally {
      setCopying(false);
    }
  }

  async function sendTo(friendId: string) {
    setSentTo((prev) => new Set(prev).add(friendId));
    await shareTemplateWithFriendAction(templateId, friendId);
    toast.success("Rutina compartida");
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" title="Compartir" />}>
        <Share2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Compartir rutina</DialogTitle>
          <DialogDescription>
            Por enlace, o directamente con un amigo desde la app.
          </DialogDescription>
        </DialogHeader>

        <Button type="button" variant="outline" className="w-full" onClick={copyLink} disabled={copying}>
          <Link2 className="h-4 w-4" />
          {copying ? "Generando..." : "Copiar enlace"}
        </Button>

        {candidates.length > 0 && (
          <div className="space-y-2">
            <p className="stat-label">Enviar a un amigo</p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {candidates.map((c) => {
                const sent = sentTo.has(c.id);
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border bg-surface p-2.5">
                    <Avatar className="h-9 w-9">
                      {c.avatarUrl && <AvatarImage src={c.avatarUrl} />}
                      <AvatarFallback>{c.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">@{c.username}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={sent ? "secondary" : "default"}
                      disabled={sent}
                      onClick={() => sendTo(c.id)}
                    >
                      {sent ? <Check className="h-3.5 w-3.5" /> : "Enviar"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
