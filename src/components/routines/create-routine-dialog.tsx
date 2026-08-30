"use client";

import { useActionState } from "react";
import { createTemplateAction } from "@/lib/actions/routines";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const initialState: ActionResult = { error: null };

export function CreateRoutineDialog() {
  const [state, formAction, pending] = useActionState(createTemplateAction, initialState);

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Nueva rutina
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva rutina</DialogTitle>
          <DialogDescription>Dale un nombre, luego añade días y ejercicios.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" placeholder="Push Pull Legs" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea id="description" name="description" rows={3} />
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creando..." : "Crear rutina"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
