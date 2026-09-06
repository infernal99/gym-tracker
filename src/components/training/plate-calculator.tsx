"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import {
  calculatePlates,
  AVAILABLE_PLATES_KG,
  DEFAULT_BAR_WEIGHT_KG,
} from "@/lib/calculations/plates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Only shown for barbell/Smith exercises (equipmentSlug) — plates-per-side
// doesn't mean anything for a dumbbell, machine stack, or bodyweight move.
// The target weight is its own editable field inside the dialog (seeded
// from whatever's in the set's weight input when it opens) rather than
// wired live to that input — the input is an uncontrolled field the set
// form remounts per set, so mirroring it live isn't worth the coupling.
export function PlateCalculatorButton({ defaultTargetKg }: { defaultTargetKg: number }) {
  const [barWeight, setBarWeight] = useState(DEFAULT_BAR_WEIGHT_KG);
  const [targetKg, setTargetKg] = useState(defaultTargetKg);
  const breakdown = calculatePlates(targetKg, barWeight);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Calculator className="h-3.5 w-3.5" />
        Discos
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Calculadora de discos</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="target-weight" className="text-xs">
                Peso objetivo (kg)
              </Label>
              <Input
                id="target-weight"
                type="number"
                step="0.5"
                min="0"
                value={targetKg || ""}
                onChange={(e) => setTargetKg(Number(e.target.value) || 0)}
                className="h-9 text-center font-bold"
              />
            </div>
            <div className="w-24 space-y-1">
              <Label htmlFor="bar-weight" className="text-xs">
                Barra (kg)
              </Label>
              <Input
                id="bar-weight"
                type="number"
                step="0.5"
                min="0"
                value={barWeight}
                onChange={(e) => setBarWeight(Number(e.target.value) || 0)}
                className="h-9 text-center"
              />
            </div>
          </div>

          {targetKg <= 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Escribe un peso para ver los discos.
            </p>
          ) : breakdown.plates.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              Con {barWeight} kg de barra ya tienes suficiente — no hace falta ningún disco.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="stat-label">Por cada lado de la barra</p>
              <div className="flex flex-wrap gap-2">
                {breakdown.plates.map((p) => (
                  <div
                    key={p.weightKg}
                    className="flex items-center gap-1.5 rounded-xl border bg-primary/10 px-3 py-2"
                  >
                    <span className="text-lg font-bold tabular-nums text-primary">{p.weightKg}</span>
                    <span className="text-xs text-muted-foreground">kg × {p.count}</span>
                  </div>
                ))}
              </div>
              {Math.abs(breakdown.differenceKg) > 0.01 && (
                <p className="text-xs text-muted-foreground">
                  No es posible cargar exactamente {targetKg} kg con los discos habituales —
                  esto se queda en {breakdown.achievedKg} kg
                  {breakdown.differenceKg > 0 ? " (faltan" : " (sobran"}{" "}
                  {Math.abs(breakdown.differenceKg)} kg).
                </p>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Discos disponibles: {AVAILABLE_PLATES_KG.join(", ")} kg
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
