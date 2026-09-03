"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { usePwaInstall } from "@/lib/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "gym-tracker-install-banner-dismissed";

// Shown on the main dashboard when the app isn't installed yet. Dismissing
// it only hides it for the rest of this browser session (sessionStorage) —
// closing the tab and coming back later shows it again, matching "cuando
// entres al menú principal" rather than nagging within the same visit.
export function InstallBanner() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (isInstalled || dismissed || (!canInstall && !isIOS)) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="fade-up flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Download className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instala Gym Tracker</p>
        <p className="text-xs text-muted-foreground">
          {isIOS
            ? "Toca Compartir y luego Añadir a pantalla de inicio."
            : "Añádela a tu pantalla de inicio para un acceso más rápido."}
        </p>
      </div>
      {!isIOS && (
        <Button size="sm" onClick={promptInstall} className="shrink-0">
          Instalar
        </Button>
      )}
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        title="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
