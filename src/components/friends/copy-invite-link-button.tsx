"use client";

import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyInviteLinkButton({ username }: { username: string }) {
  async function copyLink() {
    const url = `${window.location.origin}/invite/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copyLink}>
      <Link2 className="h-3.5 w-3.5" />
      Copiar mi enlace de invitación
    </Button>
  );
}
