import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/profile";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/components/app-logo";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex items-center gap-2">
        <AppLogo size={40} />
        <span className="text-xl font-semibold tracking-tight">Gym Tracker</span>
      </div>
      <h1 className="max-w-md text-3xl font-bold tracking-tight sm:text-4xl">
        Tu ecosistema personal de entrenamiento
      </h1>
      <p className="max-w-md text-muted-foreground">
        Registra tu progreso, alcanza tus objetivos y compite con tus amigos.
      </p>
      <div className="flex gap-3">
        <Button render={<Link href="/register" />}>Empezar gratis</Button>
        <Button variant="outline" render={<Link href="/login" />}>
          Iniciar sesión
        </Button>
      </div>
    </div>
  );
}
