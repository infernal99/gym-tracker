"use client";

import { useActionState } from "react";
import { onboardingAction } from "@/lib/actions/onboarding";
import { primaryGoalLabels, primaryGoalValues } from "@/lib/validation/auth";
import { sexLabels, sexValues } from "@/lib/validation/onboarding";
import { activityLevelLabels, activityLevelValues } from "@/lib/calculations/harris-benedict";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ActionResult = { error: null };

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(onboardingAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuéntanos sobre ti</CardTitle>
        <CardDescription>
          Con esto ajustamos tus objetivos y tu seguimiento de progreso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sex">Sexo</Label>
            <Select name="sex" defaultValue="male" required>
              <SelectTrigger id="sex" className="w-full">
                <SelectValue>
                  {(value: (typeof sexValues)[number]) => sexLabels[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {sexValues.map((sex) => (
                  <SelectItem key={sex} value={sex}>
                    {sexLabels[sex]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="primaryGoal">Objetivo principal</Label>
            <Select name="primaryGoal" defaultValue="maintain" required>
              <SelectTrigger id="primaryGoal" className="w-full">
                <SelectValue>
                  {(value: (typeof primaryGoalValues)[number]) => primaryGoalLabels[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {primaryGoalValues.map((goal) => (
                  <SelectItem key={goal} value={goal}>
                    {primaryGoalLabels[goal]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="activityLevel">Nivel de actividad</Label>
            <Select name="activityLevel" defaultValue="moderate" required>
              <SelectTrigger id="activityLevel" className="w-full">
                <SelectValue>
                  {(value: (typeof activityLevelValues)[number]) => activityLevelLabels[value]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activityLevelValues.map((level) => (
                  <SelectItem key={level} value={level}>
                    {activityLevelLabels[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="heightCm">Altura (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" step="0.1" min="0" placeholder="175" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialWeightKg">Peso inicial (kg)</Label>
              <Input
                id="initialWeightKg"
                name="initialWeightKg"
                type="number"
                step="0.1"
                min="0"
                placeholder="70"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Fecha de nacimiento (opcional)</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Guardando..." : "Empezar a entrenar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
