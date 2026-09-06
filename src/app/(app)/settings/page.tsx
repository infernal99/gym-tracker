import Link from "next/link";
import {
  ChevronRight,
  Download,
  FileText,
  KeyRound,
  LogOut,
  Mail,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/lib/actions/auth";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";
import { CustomizeBottomNav } from "@/components/settings/customize-bottom-nav";
import { TrainingSettings } from "@/components/settings/training-settings";
import { InstallAppCard } from "@/components/pwa/install-app-card";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUPPORT_EMAIL = "velouraianuri@gmail.com";
const APP_VERSION = "1.0.0";

function SettingsLink({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  external?: boolean;
}) {
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </>
  );
  const className = "card-interactive flex items-center gap-3 rounded-xl border bg-card p-3.5";

  // Link's href is typed against known app routes — mailto:/API routes need
  // a plain anchor instead.
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

export default async function SettingsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-2xl space-y-6">
      <BackButton fallbackHref="/profile" />

      <div className="fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
      </div>

      <Card className="fade-up [animation-delay:40ms]">
        <CardHeader>
          <CardTitle className="text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-sm text-muted-foreground">
              {user?.email ?? "—"}
            </span>
          </div>
          <SettingsLink href="/reset-password" icon={KeyRound} label="Cambiar contraseña" />
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full justify-start gap-3">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:80ms]">
        <CardHeader>
          <CardTitle className="text-base">Tus datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingsLink
            href="/api/export/sets"
            icon={Download}
            label="Exportar entrenamientos (CSV)"
            external
          />
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:120ms]">
        <CardHeader>
          <CardTitle className="text-base">Legal y privacidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingsLink href="/legal/privacy" icon={ShieldCheck} label="Política de privacidad" />
          <SettingsLink href="/legal/terms" icon={ScrollText} label="Términos de servicio" />
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:160ms]">
        <CardHeader>
          <CardTitle className="text-base">Soporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <SettingsLink
            href={`mailto:${SUPPORT_EMAIL}`}
            icon={FileText}
            label="Contactar con soporte"
            external
          />
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:180ms]">
        <CardHeader>
          <CardTitle className="text-base">Entrenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingSettings />
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:200ms]">
        <CardHeader>
          <CardTitle className="text-base">Barra inferior</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomizeBottomNav initialHrefs={profile.bottom_nav_links} />
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:220ms]">
        <CardHeader>
          <CardTitle className="text-base">Instalar</CardTitle>
        </CardHeader>
        <CardContent>
          <InstallAppCard />
        </CardContent>
      </Card>

      <Card className="border-destructive/30 fade-up [animation-delay:260ms]">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Zona de peligro</CardTitle>
        </CardHeader>
        <CardContent>
          <DeleteAccountDialog username={profile.username} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">Gym Tracker v{APP_VERSION}</p>
    </div>
  );
}
