"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type ActionResult } from "@/lib/actions/auth";
import { primaryGoalLabels, primaryGoalValues } from "@/lib/validation/auth";
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

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crea tu cuenta</CardTitle>
        <CardDescription>Empieza a registrar tu progreso hoy mismo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre</Label>
            <Input id="displayName" name="displayName" required autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required placeholder="ian" autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="heightCm">Altura (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" step="0.1" min="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialWeightKg">Peso inicial (kg)</Label>
              <Input id="initialWeightKg" name="initialWeightKg" type="number" step="0.1" min="0" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Fecha de nacimiento (opcional)</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creando cuenta..." : "Crear cuenta"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
