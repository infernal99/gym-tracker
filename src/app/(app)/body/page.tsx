import { TrendingDown, TrendingUp, Scale } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listWeightEntries, listMeasurements } from "@/lib/services/body";
import { WeightChart } from "@/components/body/weight-chart";
import { LogWeightDialog } from "@/components/body/log-weight-dialog";
import { LogMeasurementDialog } from "@/components/body/log-measurement-dialog";
import { StatTile } from "@/components/ui/stat-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const measurementFields = [
  { key: "chestCm", label: "Pecho" },
  { key: "waistCm", label: "Cintura" },
  { key: "hipCm", label: "Cadera" },
  { key: "armCm", label: "Brazo" },
  { key: "forearmCm", label: "Antebrazo" },
  { key: "thighCm", label: "Muslo" },
  { key: "calfCm", label: "Gemelo" },
] as const;

export default async function BodyPage() {
  const profile = await requireProfile();
  const [entries, measurements] = await Promise.all([
    listWeightEntries(profile.id),
    listMeasurements(profile.id),
  ]);

  const latest = entries[entries.length - 1];
  const previous = entries[entries.length - 2];
  const initialWeight = profile.initial_weight_kg ?? entries[0]?.weightKg ?? null;
  const currentWeight = latest?.weightKg ?? profile.initial_weight_kg ?? null;

  const delta = latest && previous ? latest.weightKg - previous.weightKg : null;
  const totalChange =
    currentWeight !== null && initialWeight !== null ? currentWeight - initialWeight : null;

  const weeklyAvg =
    totalChange !== null && entries.length > 1
      ? (() => {
          const days =
            (new Date(entries[entries.length - 1].recordedAt).getTime() -
              new Date(entries[0].recordedAt).getTime()) /
            86_400_000;
          const weeks = Math.max(days / 7, 1);
          return totalChange / weeks;
        })()
      : null;

  const latestMeasurement = measurements[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Peso corporal</h1>
        <LogWeightDialog defaultWeightKg={currentWeight} />
      </div>

      <Card className="fade-up glow-primary [animation-delay:60ms]">
        <CardContent className="flex flex-col items-center gap-1 py-8 text-center">
          <p className="stat-label">Peso actual</p>
          <p className="text-5xl font-bold tracking-tight tabular-nums">
            {currentWeight !== null ? `${currentWeight} kg` : "—"}
          </p>
          {delta !== null && delta !== 0 && (
            <span
              className={`mt-1 flex items-center gap-1 text-sm font-medium ${
                delta < 0 ? "text-success" : "text-muted-foreground"
              }`}
            >
              {delta < 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {delta > 0 ? "+" : ""}
              {delta.toFixed(1)} kg desde el último registro
            </span>
          )}
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:100ms]">
        <CardHeader>
          <CardTitle className="text-base">Evolución</CardTitle>
        </CardHeader>
        <CardContent>
          <WeightChart entries={entries} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2.5 fade-up [animation-delay:140ms]">
        <StatTile
          icon={Scale}
          label="Peso inicial"
          value={initialWeight !== null ? `${initialWeight} kg` : "—"}
        />
        <StatTile
          icon={Scale}
          label="Peso actual"
          value={currentWeight !== null ? `${currentWeight} kg` : "—"}
        />
        <StatTile
          icon={totalChange !== null && totalChange < 0 ? TrendingDown : TrendingUp}
          label="Cambio total"
          value={totalChange !== null ? `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)} kg` : "—"}
        />
        <StatTile
          icon={TrendingDown}
          label="Promedio semanal"
          value={weeklyAvg !== null ? `${weeklyAvg > 0 ? "+" : ""}${weeklyAvg.toFixed(2)} kg` : "—"}
        />
      </div>

      <Card className="fade-up [animation-delay:180ms]">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Medidas</CardTitle>
          <LogMeasurementDialog />
        </CardHeader>
        <CardContent>
          {!latestMeasurement ? (
            <p className="text-sm text-muted-foreground">Todavía no has añadido medidas.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {measurementFields.map((f) => {
                const value = latestMeasurement[f.key];
                return (
                  <div key={f.key} className="rounded-xl border bg-surface p-3 text-center">
                    <p className="text-lg font-semibold tabular-nums">
                      {value !== null ? `${value}` : "—"}
                    </p>
                    <p className="stat-label mt-0.5">{f.label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
