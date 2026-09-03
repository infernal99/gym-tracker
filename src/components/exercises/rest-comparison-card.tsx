import { Clock } from "lucide-react";
import type { RestComparison } from "@/lib/services/training";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TOLERANCE_SECONDS = 20;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")} min` : `${s} s`;
}

// Descanso real (estimated from the gap between consecutive sets, since
// there's no dedicated rest-timer log) vs. the exercise's target. Framed
// as a nudge either way — resting notably less than planned can leave
// reps on the table, resting notably more just makes the session longer
// than it needs to be.
export function RestComparisonCard({ comparison }: { comparison: RestComparison }) {
  const { targetSeconds, actualSeconds, diffSeconds } = comparison;
  const isShort = diffSeconds < -TOLERANCE_SECONDS;
  const isLong = diffSeconds > TOLERANCE_SECONDS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Descanso entre series
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="stat-label">Objetivo</p>
            <p className="text-xl font-bold tabular-nums">{formatDuration(targetSeconds)}</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="stat-label">Real (aprox.)</p>
            <p className="text-xl font-bold tabular-nums">{formatDuration(actualSeconds)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {isShort && (
            <>
              Descansas de media unos <span className="font-medium text-foreground">{Math.abs(diffSeconds)} s</span>{" "}
              menos de lo previsto. Si notas que te falta fuelle en las últimas series, prueba a
              alargarlo un poco.
            </>
          )}
          {isLong && (
            <>
              Descansas de media unos <span className="font-medium text-foreground">{diffSeconds} s</span> más
              de lo previsto. No es un problema si te encuentras bien, pero alarga la sesión.
            </>
          )}
          {!isShort && !isLong && "Tu descanso real está en línea con el objetivo."}
        </p>
      </CardContent>
    </Card>
  );
}
