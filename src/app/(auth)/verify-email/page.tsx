import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <MailCheck className="mb-2 h-10 w-10 text-primary" />
        <CardTitle>Revisa tu email</CardTitle>
        <CardDescription>
          Te hemos enviado un enlace de verificación. Confírmalo para activar tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Volver a iniciar sesión
        </Link>
      </CardContent>
    </Card>
  );
}
