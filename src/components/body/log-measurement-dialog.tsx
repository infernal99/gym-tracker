"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { logMeasurementAction } from "@/lib/actions/body";
import type { ActionResult } from "@/lib/actions/auth";
import { PAIRED_MEASUREMENTS, SINGLE_MEASUREMENTS } from "@/lib/body-measurements";
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
            {SINGLE_MEASUREMENTS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input id={f.key} name={f.key} type="number" step="0.1" min="0" />
              </div>
            ))}
          </div>

          {/* Sides side by side, so it's obvious they're a pair and easy to
              fill one after the other with the tape still in hand. */}
          <div className="space-y-3">
            {PAIRED_MEASUREMENTS.map((m) => (
              <div key={m.label} className="space-y-1">
                <Label>{m.label}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    name={m.left}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Izquierdo"
                    aria-label={`${m.label} izquierdo`}
                  />
                  <Input
                    name={m.right}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Derecho"
                    aria-label={`${m.label} derecho`}
                  />
                </div>
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
