"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { logWeightAction } from "@/lib/actions/body";
import type { ActionResult } from "@/lib/actions/auth";
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

const initialState: ActionResult = { error: null };

export function LogWeightDialog({ defaultWeightKg }: { defaultWeightKg?: number | null }) {
  const [state, formAction, pending] = useActionState(logWeightAction, initialState);

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Registrar peso
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar peso</DialogTitle>
          <DialogDescription>Añade tu peso de hoy para seguir tu evolución.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weightKg">Peso (kg)</Label>
            <Input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.1"
              min="0"
              defaultValue={defaultWeightKg ?? ""}
              autoFocus
              required
              className="h-14 text-center text-2xl font-bold tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Input id="note" name="note" placeholder="Ej: en ayunas" />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
