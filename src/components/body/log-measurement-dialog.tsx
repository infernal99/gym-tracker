"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { logMeasurementAction } from "@/lib/actions/body";
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

const fields = [
  { name: "chestCm", label: "Pecho" },
  { name: "waistCm", label: "Cintura" },
  { name: "hipCm", label: "Cadera" },
  { name: "armCm", label: "Brazo" },
  { name: "forearmCm", label: "Antebrazo" },
  { name: "thighCm", label: "Muslo" },
  { name: "calfCm", label: "Gemelo" },
] as const;

export function LogMeasurementDialog() {
  const [state, formAction, pending] = useActionState(logMeasurementAction, initialState);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="h-4 w-4" />
        Añadir medidas
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevas medidas</DialogTitle>
          <DialogDescription>
            Todos los campos son opcionales, en centímetros.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input id={f.name} name={f.name} type="number" step="0.1" min="0" />
              </div>
            ))}
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Guardando..." : "Guardar medidas"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
