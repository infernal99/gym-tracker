"use client";

import { useEffect } from "react";

// Registers the service worker app-wide — needed for the browser to treat
// the app as installable, not just for offline caching.
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a nice-to-have, not a hard requirement — a
        // failed registration shouldn't be user-visible.
      });
    }
  }, []);

  return null;
}
