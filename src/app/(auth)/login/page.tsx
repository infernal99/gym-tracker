"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type ActionResult } from "@/lib/actions/auth";
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

const initialState: ActionResult = { error: null };

// Reads the ?redirect= param (set by the middleware when it bounces someone
// off a protected page, or by an invite link) so a successful login can send
// them back where they meant to go instead of always landing on /dashboard.
// Split out because useSearchParams needs a Suspense boundary above it.
function RedirectField() {
  const redirectTo = useSearchParams().get("redirect");
  if (!redirectTo) return null;
  return <input type="hidden" name="redirectTo" value={redirectTo} />;
}

function DeletedAccountNotice() {
  const deleted = useSearchParams().get("deleted");
  if (!deleted) return null;
  return (
    <p className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
      Tu cuenta se ha eliminado correctamente.
    </p>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicia sesión</CardTitle>
        <CardDescription>Vuelve a tu entrenamiento.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <DeletedAccountNotice />
        </Suspense>
        <form action={formAction} className="space-y-4">
          <Suspense fallback={null}>
            <RedirectField />
          </Suspense>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link href="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Regístrate
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
