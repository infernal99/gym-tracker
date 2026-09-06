"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BellRing } from "lucide-react";

const AUTO_DISMISS_MS = 4000;

// iPhone Safari never implemented the Vibration API, so this is the only
// cue an iOS user gets — it has to be genuinely hard to miss, not a small
// toast. Portaled straight to <body> rather than rendered inline: an
// ancestor's `fade-up` entrance animation leaves a resting `transform`
// behind it (animation-fill-mode: both), and any transform on an ancestor
// quietly breaks `position: fixed` for everything under it.
export function RestTimerAlert({ trigger }: { trigger: number }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const id = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [trigger]);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      role="alert"
      onClick={() => setVisible(false)}
      className="fade-up fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-50 flex cursor-pointer items-center gap-3 rounded-2xl bg-success px-4 py-3.5 text-success-foreground shadow-2xl"
    >
      <BellRing className="h-6 w-6 shrink-0 animate-bounce" />
      <p className="text-lg font-bold leading-tight">¡Descanso terminado!</p>
    </div>,
    document.body,
  );
}
