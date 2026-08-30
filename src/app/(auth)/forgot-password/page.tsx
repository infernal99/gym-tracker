"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordResult } from "@/lib/actions/auth";
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

const initialState: ForgotPasswordResult = { status: "idle" };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>Te enviaremos un enlace para restablecerla.</CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "sent" ? (
          <p className="text-sm text-muted-foreground">
            Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
