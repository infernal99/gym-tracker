import { History, Sparkles } from "lucide-react";

type ReferenceSet = {
  set_number: number;
  side: "both" | "left" | "right";
  weight_kg: number | null;
  reps: number | null;
};

function formatSet(set: ReferenceSet) {
  return `${set.weight_kg ?? "BW"} kg × ${set.reps ?? "-"}`;
}

// What the user did on this exact set last time, shown before they type
// anything. The per-set reference is the point: seeing "the whole session
// was 80×8, 80×8, 77.5×10" doesn't tell you what to load for set 3, and
// the later sets are usually where a session is actually won or lost.
//
// Deliberately neutral — it reports the number and leaves "match it, beat
// it, or back off" to the user, rather than prescribing a heavier load.
export function LastTimeReference({
  lastPerformance,
  activeSet,
  activeSide,
  isUnilateral,
}: {
  lastPerformance: { completedAt: string; sets: ReferenceSet[] } | null;
  activeSet: number;
  activeSide: "both" | "left" | "right";
  isUnilateral: boolean;
}) {
  if (!lastPerformance || lastPerformance.sets.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-dashed bg-surface px-3 py-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-semibold">Primera vez</p>
          <p className="text-sm text-muted-foreground">
            Todavía no tienes historial de este ejercicio. Registra esta sesión y empezaremos a
            seguir tu progreso.
          </p>
        </div>
      </div>
    );
  }

  const matching = lastPerformance.sets.find(
    (s) => s.set_number === activeSet && (!isUnilateral || s.side === activeSide),
  );
  // Doing more sets than last time is normal, so fall back to that session's
  // last set rather than showing nothing.
  const fallback = isUnilateral
    ? [...lastPerformance.sets].reverse().find((s) => s.side === activeSide)
    : lastPerformance.sets[lastPerformance.sets.length - 1];
  const reference = matching ?? fallback ?? null;

  const others = lastPerformance.sets.filter(
    (s) => s !== reference && (!isUnilateral || s.side === activeSide),
  );

  return (
    <div className="rounded-xl border bg-surface px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="stat-label flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          La última vez
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(lastPerformance.completedAt).toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          })}
        </p>
      </div>

      {reference ? (
        <p className="mt-1 text-2xl font-bold tabular-nums">
          {formatSet(reference)}
          {!matching && (
            <span className="ml-2 align-middle text-xs font-medium text-muted-foreground">
              (última serie)
            </span>
          )}
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">Sin referencia para esta serie.</p>
      )}

      {others.length > 0 && (
        <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
          {others.map((s) => `S${s.set_number} ${formatSet(s)}`).join(" · ")}
        </p>
      )}
    </div>
  );
}
