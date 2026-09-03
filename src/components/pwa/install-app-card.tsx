"use client";

import { Download, Smartphone } from "lucide-react";
import { usePwaInstall } from "@/lib/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

// The "Instalar" control for Perfil > Ajustes — always visible there
// (unlike the dashboard banner, which can be dismissed), so there's a
// permanent place to install from even after closing the banner once.
export function InstallAppCard() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
          <Smartphone className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">App instalada</p>
          <p className="text-sm text-muted-foreground">Ya tienes Gym Tracker en tu dispositivo.</p>
        </div>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">Instalar la app</p>
            <p className="text-sm text-muted-foreground">
              Pulsa <span className="font-medium text-foreground">Compartir</span> y luego{" "}
              <span className="font-medium text-foreground">Añadir a pantalla de inicio</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Instalar la app</p>
        <p className="text-sm text-muted-foreground">
          {canInstall ? "Añádela a tu pantalla de inicio." : "Tu navegador no ofrece instalación todavía."}
        </p>
      </div>
      <Button size="sm" onClick={promptInstall} disabled={!canInstall} className="shrink-0">
        Instalar
      </Button>
    </div>
  );
}
