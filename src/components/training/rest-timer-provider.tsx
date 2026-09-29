"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RestTimerAlert } from "@/components/training/rest-timer-alert";
import { useRestTimerVibration } from "@/lib/hooks/use-rest-timer-vibration";

// The rest timer belongs to the workout session, not to whichever exercise
// card happens to be on screen. It used to live inside that card, so leaving
// the training page, or even switching exercise, unmounted it: the count
// stopped or started over, and a pause or ±15s was lost. It now lives above
// every page, persisted to the device, and keyed to the last set logged
// anywhere in the session.

const STORAGE_KEY = "gym-tracker:rest";
// 6 buzzes of 300ms + 5 pauses of 150ms ≈ 2.55s total.
const VIBRATION_PATTERN = [300, 150, 300, 150, 300, 150, 300, 150, 300, 150, 300];
// A rest that ran out this long ago is finished business, so it stops
// following you around the app.
const EXPIRE_AFTER_DONE_MS = 5 * 60_000;

type RestState = {
  sessionId: string;
  // When the set that started this rest was logged. It's the rest's
  // identity: the same set never starts a second rest.
  startedAt: number;
  endAt: number;
  durationMs: number;
  paused: boolean;
  pausedRemainingMs: number;
  // Bumped by "Reiniciar", so a restarted rest can alert again.
  runId: number;
  label: string;
  exerciseName: string | null;
};

type StartInput = {
  sessionId: string;
  startedAt: string;
  seconds: number;
  label: string;
  exerciseName: string | null;
};

type RestTimerContextValue = {
  rest: RestState | null;
  remainingMs: number;
  done: boolean;
  start: (input: StartInput) => void;
  togglePause: () => void;
  shift: (deltaMs: number) => void;
  restart: () => void;
  skip: () => void;
  clear: (sessionId?: string) => void;
};

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

function readStored(): RestState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RestState) : null;
  } catch {
    return null;
  }
}

function isExpired(rest: RestState, now: number) {
  return !rest.paused && now - rest.endAt > EXPIRE_AFTER_DONE_MS;
}

// Of two candidate rests, the one from the later set wins. On a tie it's the
// same rest, and the stored copy is the one carrying any pause or ±15s.
function pickLatest(current: RestState | null, stored: RestState | null) {
  if (!current) return stored;
  if (!stored) return current;
  return stored.startedAt >= current.startedAt ? stored : current;
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [storedRest, setRest] = useState<RestState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const loadedRef = useRef(false);

  // Declared before the persist effect so it reads storage before anything
  // writes to it. Children's effects run first, so a RestSync may already
  // have started a rest by now — hence merging rather than overwriting.
  // Server and first client render both start at null; the device's copy
  // can only be read after mount, or hydration would disagree.
  useEffect(() => {
    const stored = readStored();
    loadedRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, which only exists after mount
    setRest((prev) => pickLatest(prev, stored));
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      if (storedRest) localStorage.setItem(STORAGE_KEY, JSON.stringify(storedRest));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage blocked (private browsing): the timer still works for as
      // long as the app stays open, it just won't survive a reload.
    }
  }, [storedRest]);

  // Derived rather than cleared from an effect: an expired rest just stops
  // being exposed, and the next load drops it from storage.
  const rest = storedRest && !isExpired(storedRest, now) ? storedRest : null;

  // The time is always read off the clock against endAt, never counted down
  // tick by tick — phones throttle or freeze timers while the screen is off
  // or another app is in front, and a ticked counter loses every tick it
  // missed. The interval only refreshes the display; coming back to the app
  // re-reads the clock straight away, since that's exactly when a throttled
  // interval is furthest behind.
  const active = rest !== null && !rest.paused;
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    const id = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);
    window.addEventListener("pageshow", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [active]);

  const remainingMs = rest
    ? rest.paused
      ? rest.pausedRemainingMs
      : Math.max(0, rest.endAt - now)
    : 0;
  const done = rest !== null && remainingMs <= 0;

  // Buzz and flash once per run, wherever in the app you are. A rest that was
  // already over the first time we see it (loaded after the OS closed the
  // app) ran out while nothing was running — you're looking at the screen
  // now, so it isn't announced as if it just happened.
  const { enabled: vibrationEnabled } = useRestTimerVibration();
  const [alertTrigger, setAlertTrigger] = useState(0);
  const seenRunRef = useRef<string | null>(null);
  const alertedRunRef = useRef<string | null>(null);
  useEffect(() => {
    if (!rest) return;
    const runKey = `${rest.startedAt}:${rest.runId}`;
    if (seenRunRef.current !== runKey) {
      seenRunRef.current = runKey;
      if (done) {
        alertedRunRef.current = runKey;
        return;
      }
    }
    if (done && alertedRunRef.current !== runKey) {
      alertedRunRef.current = runKey;
      setAlertTrigger((n) => n + 1);
      // iOS Safari never implemented the Vibration API; the banner is the
      // cue iPhone users get.
      if (vibrationEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(VIBRATION_PATTERN);
      }
    }
  }, [rest, done, vibrationEnabled]);

  const start = useCallback((input: StartInput) => {
    const parsed = Date.parse(input.startedAt);
    if (Number.isNaN(parsed)) return;
    const current = Date.now();
    setNow(current);
    setRest((prev) => {
      if (prev && prev.sessionId === input.sessionId && prev.startedAt >= parsed) return prev;
      const durationMs = input.seconds * 1000;
      // Counted from when the set was logged, so the rest is right even if
      // the page only loads now. Clamped to the phone's clock in case the
      // server's runs slightly ahead.
      const endAt = Math.min(parsed, current) + durationMs;
      const next: RestState = {
        sessionId: input.sessionId,
        startedAt: parsed,
        endAt,
        durationMs,
        paused: false,
        pausedRemainingMs: durationMs,
        runId: 0,
        label: input.label,
        exerciseName: input.exerciseName,
      };
      return isExpired(next, current) ? prev : next;
    });
  }, []);

  const togglePause = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setRest((prev) => {
      if (!prev) return prev;
      return prev.paused
        ? { ...prev, paused: false, endAt: current + prev.pausedRemainingMs }
        : { ...prev, paused: true, pausedRemainingMs: Math.max(0, prev.endAt - current) };
    });
  }, []);

  const shift = useCallback((deltaMs: number) => {
    const current = Date.now();
    setNow(current);
    setRest((prev) => {
      if (!prev) return prev;
      const durationMs = Math.max(0, prev.durationMs + deltaMs);
      return prev.paused
        ? { ...prev, durationMs, pausedRemainingMs: Math.max(0, prev.pausedRemainingMs + deltaMs) }
        : { ...prev, durationMs, endAt: Math.max(current, prev.endAt + deltaMs) };
    });
  }, []);

  const restart = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setRest((prev) =>
      prev
        ? {
            ...prev,
            paused: false,
            endAt: current + prev.durationMs,
            pausedRemainingMs: prev.durationMs,
            runId: prev.runId + 1,
          }
        : prev,
    );
  }, []);

  const skip = useCallback(() => {
    const current = Date.now();
    setNow(current);
    setRest((prev) => (prev ? { ...prev, paused: false, endAt: current, pausedRemainingMs: 0 } : prev));
  }, []);

  const clear = useCallback((sessionId?: string) => {
    setRest((prev) => (!prev || (sessionId && prev.sessionId !== sessionId) ? prev : null));
  }, []);

  const value = useMemo(
    () => ({ rest, remainingMs, done, start, togglePause, shift, restart, skip, clear }),
    [rest, remainingMs, done, start, togglePause, shift, restart, skip, clear],
  );

  return (
    <RestTimerContext.Provider value={value}>
      {children}
      <RestTimerAlert trigger={alertTrigger} />
    </RestTimerContext.Provider>
  );
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error("useRestTimer must be used inside RestTimerProvider");
  return ctx;
}

// Rendered by the training page with the session's latest logged set. Since
// that timestamp comes from the database, calling this on every render is
// harmless — start() ignores a set it has already seen.
export function RestSync({
  sessionId,
  latest,
}: {
  sessionId: string;
  latest: Omit<StartInput, "sessionId"> | null;
}) {
  const { rest, start, clear } = useRestTimer();

  useEffect(() => {
    if (latest) start({ sessionId, ...latest });
  }, [sessionId, latest, start]);

  // A rest left over from a different (earlier) workout doesn't belong here.
  useEffect(() => {
    if (rest && rest.sessionId !== sessionId) clear();
  }, [rest, sessionId, clear]);

  return null;
}

export function ClearRestTimer({ sessionId }: { sessionId: string }) {
  const { clear } = useRestTimer();
  useEffect(() => clear(sessionId), [sessionId, clear]);
  return null;
}
