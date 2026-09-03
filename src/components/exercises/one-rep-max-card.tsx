import { repTargetsFor1rm } from "@/lib/calculations/strength";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// The estimated 1RM turned into working weights. A number on its own
// ("1RM: 102 kg") isn't actionable — what you want at the rack is "for 8
// reps, load 80 kg", so the table is the point and the 1RM is the header.
export function OneRepMaxCard({
  oneRepMaxKg,
  allTimeBestKg,
  basedOn,
}: {
  oneRepMaxKg: number;
  allTimeBestKg: number;
  basedOn: { weightKg: number; reps: number };
}) {
  const targets = repTargetsFor1rm(oneRepMaxKg);
  const isBelowBest = allTimeBestKg > oneRepMaxKg * 1.005;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">1RM estimado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-bold tabular-nums">{Math.round(oneRepMaxKg)} kg</p>
            <p className="text-xs text-muted-foreground">
              Según tu mejor serie reciente: {basedOn.weightKg} kg × {basedOn.reps}
            </p>
          </div>
          {isBelowBest && (
            <div className="text-right">
              <p className="font-semibold tabular-nums">{Math.round(allTimeBestKg)} kg</p>
              <p className="stat-label">Tu récord</p>
            </div>
          )}
        </div>

        <div>
          <p className="stat-label mb-1.5">Peso aproximado por repeticiones</p>
          <div className="grid grid-cols-4 gap-1.5">
            {targets.map((t) => (
              <div key={t.reps} className="rounded-lg border bg-muted/40 p-2 text-center">
                <p className="text-sm font-semibold tabular-nums">{t.weightKg} kg</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  ×{t.reps} · {t.percentOfMax}%
                </p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Estimación con la fórmula de Epley. Es una guía, no un máximo real: úsala como punto de
            partida y ajusta según cómo te salga la primera serie.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
