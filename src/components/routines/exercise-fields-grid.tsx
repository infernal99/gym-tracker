"use client";

import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExerciseFieldsGrid({
  defaults,
}: {
  defaults?: Partial<{
    targetSets: number | null;
    targetRepsMin: number | null;
    targetRepsMax: number | null;
    targetWeightKg: number | null;
    targetRir: number | null;
    restSeconds: number | null;
    isUnilateral: boolean;
    restBetweenSidesSeconds: number | null;
  }>;
}) {
  const checkboxId = useId();
  const [isUnilateral, setIsUnilateral] = useState(defaults?.isUnilateral ?? false);

  return (
    <>
      <div>
        <Label className="text-xs">Series</Label>
        <Input
          name="targetSets"
          type="number"
          min={1}
          defaultValue={defaults?.targetSets ?? 3}
          required
        />
      </div>
      <div>
        <Label className="text-xs">Reps min</Label>
        <Input
          name="targetRepsMin"
          type="number"
          min={1}
          defaultValue={defaults?.targetRepsMin ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">Reps max</Label>
        <Input
          name="targetRepsMax"
          type="number"
          min={1}
          defaultValue={defaults?.targetRepsMax ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">Peso (kg)</Label>
        <Input
          name="targetWeightKg"
          type="number"
          step="0.5"
          min={0}
          defaultValue={defaults?.targetWeightKg ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">RIR</Label>
        <Input
          name="targetRir"
          type="number"
          min={0}
          max={10}
          defaultValue={defaults?.targetRir ?? undefined}
        />
      </div>
      <div>
        <Label className="text-xs">Descanso (s)</Label>
        <Input
          name="restSeconds"
          type="number"
          min={0}
          defaultValue={defaults?.restSeconds ?? 180}
        />
      </div>
      <div className="col-span-2 flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
        <input
          id={checkboxId}
          name="isUnilateral"
          type="checkbox"
          defaultChecked={defaults?.isUnilateral ?? false}
          onChange={(e) => setIsUnilateral(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        <Label htmlFor={checkboxId} className="cursor-pointer text-xs font-normal">
          Unilateral (un lado a la vez)
        </Label>
      </div>
      {isUnilateral && (
        <div className="col-span-2">
          <Label className="text-xs">Descanso entre lados (s)</Label>
          <Input
            name="restBetweenSidesSeconds"
            type="number"
            min={0}
            defaultValue={defaults?.restBetweenSidesSeconds ?? 60}
          />
        </div>
      )}
    </>
  );
}
