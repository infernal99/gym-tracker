"use client";

import { useCallback, useEffect, useState } from "react";

// Per-device, not per-account — someone using the app on two phones might
// want it on for one and off for the other, so this deliberately lives in
// localStorage rather than the profile row.
const STORAGE_KEY = "gym-tracker:rest-timer-vibrate";

function readStoredValue(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function useRestTimerVibration() {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    setEnabledState(readStoredValue());
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // Private browsing / storage blocked — the toggle still works for
      // the rest of this session via state, it just won't persist.
    }
  }, []);

  return { enabled, setEnabled };
}
