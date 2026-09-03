import { Download } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getMuscleVolumeStats } from "@/lib/services/stats";
import { MuscleVolumeChart } from "@/components/stats/muscle-volume-chart";
import { ZONE_LABELS, muscleZoneColor } from "@/lib/muscle-colors";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StatsPage() {
  const profile = await requireProfile();
  const { weeks, zoneTotals } = await getMuscleVolumeStats(profile.id, 12);

  const totalVolume = zoneTotals.reduce((sum, z) => sum + z.volumeKg, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackButton fallbackHref="/profile" />
      <h1 className="text-2xl font-bold tracking-tight fade-up">Estadísticas</h1>

      <Card className="fade-up [animation-delay:40ms]">
        <CardHeader>
          <CardTitle className="text-base">Volumen por grupo muscular</CardTitle>
        </CardHeader>
        <CardContent>
          <MuscleVolumeChart weeks={weeks} />
        </CardContent>
      </Card>

      {zoneTotals.length > 0 && (
        <Card className="fade-up [animation-delay:80ms]">
          <CardHeader>
            <CardTitle className="text-base">Reparto de las últimas 12 semanas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {zoneTotals.map((zone) => {
              const pct = totalVolume > 0 ? (zone.volumeKg / totalVolume) * 100 : 0;
              return (
                <div key={zone.zone} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: muscleZoneColor(zone.zone) }}
                      />
                      {ZONE_LABELS[zone.zone]}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {zone.sets} series · {Math.round(zone.volumeKg).toLocaleString("es-ES")} kg ·{" "}
                      <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: muscleZoneColor(zone.zone) }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card className="fade-up [animation-delay:120ms]">
        <CardHeader>
          <CardTitle className="text-base">Exportar</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href="/api/export/sets"
            download
            className="card-interactive flex items-center gap-3 rounded-xl border bg-card p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">Descargar historial (CSV)</p>
              <p className="text-sm text-muted-foreground">
                Una fila por serie: fecha, ejercicio, peso, repeticiones y volumen.
              </p>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
