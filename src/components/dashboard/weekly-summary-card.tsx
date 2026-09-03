import Link from "next/link";
import { Check, Clock, Dumbbell, Flame, Layers, Trophy } from "lucide-react";
import type { WeeklySummary } from "@/lib/services/weekly-summary";
import { DeltaBadge } from "@/components/ui/delta-badge";
import { Card, CardContent } from "@/components/ui/card";

const WEEKDAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];

function Row({
  icon: Icon,
  label,
  value,
  current,
  previous,
  unit,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  current: number;
  previous: number;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="w-14 shrink-0 text-right">
        <DeltaBadge current={current} previous={previous} unit={unit} />
      </span>
    </div>
  );
}

// Week-over-week recap on the dashboard: seeing "3 entrenos, +12%" beats a
// raw number for coming back tomorrow, and the weekday strip makes the gaps
// in the current week obvious at a glance.
export function WeeklySummaryCard({ summary }: { summary: WeeklySummary }) {
  const { thisWeek, lastWeek, weekdaysTrained, topExercise } = summary;
  const todayIndex = (new Date().getDay() + 6) % 7;

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between gap-2">
          <p className="stat-label">Resumen de la semana</p>
          {summary.currentStreak > 0 ? (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Flame className="h-3.5 w-3.5" />
              {summary.currentStreak} d de racha
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">vs. semana pasada</span>
          )}
        </div>

        <div className="flex justify-between gap-1">
          {WEEKDAY_INITIALS.map((initial, i) => {
            const trained = weekdaysTrained[i];
            const isToday = i === todayIndex;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span
                  className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}
                >
                  {initial}
                </span>
                <div
                  className={`flex h-8 w-full items-center justify-center rounded-lg border text-xs ${
                    trained
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : isToday
                        ? "border-dashed border-primary/40 text-muted-foreground"
                        : "border-border/60 bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {trained ? <Check className="h-4 w-4" /> : ""}
                </div>
              </div>
            );
          })}
        </div>

        <div className="divide-y divide-border/60">
          <Row
            icon={Dumbbell}
            label="Entrenamientos"
            value={String(thisWeek.workouts)}
            current={thisWeek.workouts}
            previous={lastWeek.workouts}
          />
          <Row
            icon={Layers}
            label="Volumen"
            value={`${Math.round(thisWeek.volumeKg).toLocaleString("es-ES")} kg`}
            current={thisWeek.volumeKg}
            previous={lastWeek.volumeKg}
            unit=" kg"
          />
          <Row
            icon={Layers}
            label="Series"
            value={String(thisWeek.sets)}
            current={thisWeek.sets}
            previous={lastWeek.sets}
          />
          <Row
            icon={Clock}
            label="Tiempo"
            value={`${thisWeek.minutes} min`}
            current={thisWeek.minutes}
            previous={lastWeek.minutes}
            unit=" min"
          />
          <Row
            icon={Trophy}
            label="PRs"
            value={String(thisWeek.prs)}
            current={thisWeek.prs}
            previous={lastWeek.prs}
          />
        </div>

        {topExercise && (
          <Link
            href={`/exercises/${topExercise.slug}`}
            className="card-interactive flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate">
              Más volumen: <span className="font-medium">{topExercise.name}</span>
            </span>
            <span className="shrink-0 pl-2 tabular-nums text-muted-foreground">
              {Math.round(topExercise.volumeKg).toLocaleString("es-ES")} kg
            </span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
