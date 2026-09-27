"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipForward, RotateCcw, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RestTimerAlert } from "@/components/training/rest-timer-alert";
import { useRestTimerVibration } from "@/lib/hooks/use-rest-timer-vibration";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// 6 buzzes of 300ms + 5 pauses of 150ms ≈ 2.55s total.
const VIBRATION_PATTERN = [300, 150, 300, 150, 300, 150, 300, 150, 300, 150, 300];

export function RestTimer({
  seconds,
  label = "Descanso",
  startedAt,
}: {
  seconds: number;
  label?: string;
  // When the set that started this rest was logged. Counting from there,
  // rather than from whenever this mounted, keeps the rest right even if the
  // phone's OS closed the app in the background and it reloads from scratch.
  startedAt?: string | null;
}) {
  const [duration, setDuration] = useState(seconds);
  const [running, setRunning] = useState(true);
  // The countdown is an end time on the wall clock, not a counter ticked
  // down once a second. Phones throttle or freeze timers entirely while the
  // screen is off or another app is in front, and a ticked counter simply
  // loses every tick it missed — the rest looked frozen and never caught
  // up. Measured against the clock, the time is right the moment the page
  // runs again.
  const [endAt, setEndAt] = useState(() => {
    const parsed = startedAt ? Date.parse(startedAt) : NaN;
    // Clamped to now: a server clock slightly ahead of the phone's shouldn't
    // make the rest longer than it's meant to be.
    const start = Number.isNaN(parsed) ? Date.now() : Math.min(parsed, Date.now());
    return start + seconds * 1000;
  });
  const [pausedRemainingMs, setPausedRemainingMs] = useState(seconds * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    // Coming back to the app is exactly when the throttled interval is
    // furthest behind, so re-read the clock right then instead of waiting
    // for its next (possibly much later) tick.
    const onResume = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", tick);
    window.addEventListener("pageshow", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", tick);
      window.removeEventListener("pageshow", tick);
    };
  }, [running]);

  const remainingMs = running ? Math.max(0, endAt - now) : pausedRemainingMs;
  const remaining = Math.ceil(remainingMs / 1000);

  // Shifts the countdown by `deltaMs` wherever it currently lives — the end
  // time while running, the frozen remainder while paused.
  function shift(deltaMs: number) {
    const current = Date.now();
    if (running) {
      setEndAt((end) => Math.max(current, end + deltaMs));
      setNow(current);
    } else {
      setPausedRemainingMs((ms) => Math.max(0, ms + deltaMs));
    }
  }

  function togglePause() {
    const current = Date.now();
    if (running) {
      setPausedRemainingMs(Math.max(0, endAt - current));
      setRunning(false);
    } else {
      setEndAt(current + pausedRemainingMs);
      setNow(current);
      setRunning(true);
    }
  }

  function restart() {
    const current = Date.now();
    setEndAt(current + duration * 1000);
    setNow(current);
    setRunning(true);
  }

  function skip() {
    const current = Date.now();
    setEndAt(current);
    setNow(current);
    setPausedRemainingMs(0);
  }

  const done = remaining <= 0;
  const { enabled: vibrationEnabled } = useRestTimerVibration();

  // Fires once per rest period, whether it runs out naturally or gets
  // skipped. With the screen off the page isn't running, so this lands the
  // moment you come back if the rest already ran out meanwhile — the time
  // itself is correct either way. iOS Safari never implemented the
  // Vibration API at all (no buzz on iPhone, PWA or not), hence the big
  // visual alert below, which is the only cue those users get.
  // Starts "already fired" when the rest had run out before this even
  // mounted — reopening an exercise whose rest ended long ago shouldn't
  // buzz and flash the banner as if it just happened.
  const vibratedRef = useRef(done);
  const [alertTrigger, setAlertTrigger] = useState(0);
  useEffect(() => {
    if (done && !vibratedRef.current) {
      vibratedRef.current = true;
      setAlertTrigger((n) => n + 1);
      if (vibrationEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(VIBRATION_PATTERN);
      }
    }
    if (!done) vibratedRef.current = false;
  }, [done, vibrationEnabled]);

  const progress = duration > 0 ? remaining / duration : 0;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className={`rounded-2xl border px-4 py-3 transition-colors duration-normal ${done ? "border-success/30 bg-success/5" : "bg-surface"}`}
    >
      <RestTimerAlert trigger={alertTrigger} />
      <div className="flex items-center justify-between">
        <div>
          <p className="stat-label">{label}</p>
          {/* Read off the clock, so the server's render and the phone's can
              land a second apart — expected, not a hydration bug. */}
          <p
            suppressHydrationWarning
            className={`font-mono text-3xl font-bold tabular-nums ${done ? "text-success" : "text-foreground"}`}
          >
            {done ? "¡Listo!" : formatTime(remaining)}
          </p>
          <p className="text-xs text-muted-foreground">Sugerido {formatTime(seconds)}</p>
        </div>
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r={RING_RADIUS}
              fill="none"
              stroke="var(--border)"
              strokeWidth="4"
            />
            <circle
              suppressHydrationWarning
              cx="32"
              cy="32"
              r={RING_RADIUS}
              fill="none"
              stroke={done ? "var(--success)" : "var(--primary)"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            title={running ? "Pausar" : "Reanudar"}
            onClick={togglePause}
          >
            {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-center gap-1 border-t pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="-15s"
          onClick={() => {
            setDuration((d) => Math.max(0, d - 15));
            shift(-15_000);
          }}
        >
          <Minus className="h-3.5 w-3.5" />
          15s
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="+15s"
          onClick={() => {
            setDuration((d) => d + 15);
            shift(15_000);
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          15s
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          title="Reiniciar"
          onClick={restart}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" title="Saltar" onClick={skip}>
          <SkipForward className="h-3.5 w-3.5" />
          Saltar
        </Button>
      </div>
    </div>
  );
}
