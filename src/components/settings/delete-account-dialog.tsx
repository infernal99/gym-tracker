"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAccountAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CONFIRM_WORD = "ELIMINAR";

// Required by App Store (5.1.1v) / Play Store review: account deletion must
// be reachable from inside the app, not just via a support email. The typed
// confirmation word is the guard against an accidental tap on something
// this irreversible.
export function DeleteAccountDialog({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAccountAction();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmText("");
      }}
    >
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2 className="h-4 w-4" />
        Eliminar cuenta
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Eliminar cuenta de @{username}
          </DialogTitle>
          <DialogDescription>
            Esta acción es permanente. Se borrarán tu perfil, rutinas, historial de
            entrenamientos, peso corporal, fotos de progreso, logros, amigos y todo lo
            demás asociado a tu cuenta. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="confirm-delete">
            Escribe <span className="font-semibold">{CONFIRM_WORD}</span> para confirmar
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
          />
        </div>
        <Button
          variant="destructive"
          className="w-full"
          disabled={confirmText !== CONFIRM_WORD || pending}
          onClick={handleDelete}
        >
          {pending ? "Eliminando..." : "Eliminar mi cuenta para siempre"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
