"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExerciseProgressPoint, ExerciseSessionSets } from "@/lib/services/training";

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday = 0
  d.setHours(0, 0, 0, 0);
  return d;
}

const metrics = [
  { key: "e1rm", label: "1RM estimado", unit: "kg" },
  { key: "weightKg", label: "Peso", unit: "kg" },
  { key: "volumeKg", label: "Volumen", unit: "kg" },
] as const;

const periods = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "1y", label: "1A", days: 365 },
  { key: "all", label: "Todo", days: null },
] as const;

export function ExerciseChart({
  points,
  sessionPoints,
  weekOverWeek,
}: {
  points: ExerciseProgressPoint[];
  sessionPoints: ExerciseSessionSets[];
  weekOverWeek: { changePct: number | null };
}) {
  const [metric, setMetric] = useState<(typeof metrics)[number]["key"]>("e1rm");
  const [period, setPeriod] = useState<(typeof periods)[number]["key"]>("all");
  // "best" = the session's top set (current behaviour); otherwise a fixed
  // set_number so you can see e.g. set 2's progression on its own, since
  // it doesn't always move in lockstep with set 1.
  const [setNumber, setSetNumber] = useState<number | "best">("best");
  const activeMetric = metrics.find((m) => m.key === metric)!;
  const activePeriod = periods.find((p) => p.key === period)!;

  const maxSetCount = Math.max(0, ...sessionPoints.map((sp) => sp.sets.length));
  const setOptions = Array.from({ length: Math.min(maxSetCount, 6) }, (_, i) => i + 1);

  const resolvedPoints: ExerciseProgressPoint[] = useMemo(() => {
    if (setNumber === "best") return points;
    return sessionPoints
      .map((sp) => {
        const set = sp.sets.find((s) => s.setNumber === setNumber);
        if (!set) return null;
        return {
          date: sp.date,
          weightKg: set.weightKg,
          reps: set.reps,
          e1rm: set.e1rm,
          volumeKg: sp.volumeKg,
        };
      })
      .filter((p): p is ExerciseProgressPoint => p !== null);
  }, [points, sessionPoints, setNumber]);

  // The selected serie's own % change in estimated 1RM vs last week — kept
  // separate from the "combined" figure shown above the chart (which
  // averages every set number together) so picking S2 here shows S2's own
  // trend, not the exercise-wide average.
  const serieChangePct = useMemo(() => {
    if (setNumber === "best") return weekOverWeek.changePct;

    const now = new Date();
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    let bestThisWeek = 0;
    let bestLastWeek = 0;
    for (const sp of sessionPoints) {
      const set = sp.sets.find((s) => s.setNumber === setNumber);
      if (!set) continue;
      const d = new Date(sp.date);
      if (d >= thisWeekStart) {
        if (set.e1rm > bestThisWeek) bestThisWeek = set.e1rm;
      } else if (d >= lastWeekStart) {
        if (set.e1rm > bestLastWeek) bestLastWeek = set.e1rm;
      }
    }
    if (bestThisWeek === 0 || bestLastWeek === 0) return null;
    return ((bestThisWeek - bestLastWeek) / bestLastWeek) * 100;
  }, [setNumber, sessionPoints, weekOverWeek]);

  const cutoff =
    activePeriod.days !== null ? Date.now() - activePeriod.days * 86_400_000 : null;
  const filteredPoints =
    cutoff !== null ? resolvedPoints.filter((p) => new Date(p.date).getTime() >= cutoff) : resolvedPoints;

  const data = filteredPoints.map((p) => ({
    date: new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    value: p[metric],
  }));

  // Gym progression is often 0.5kg or less — the default domain starts at 0
  // and picks coarse round-number ticks (0/3/6/9/12), which flattens small
  // real changes into an almost-invisible line. Zoom the axis tight to the
  // data's own range instead, with headroom sized to how small that range is.
  const values = data.map((d) => d.value);
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 1;
  const spread = dataMax - dataMin;
  const padding = spread > 0 ? Math.max(spread * 0.15, 0.5) : Math.max(dataMax * 0.1, 1);
  const yDomain: [number, number] = [
    Math.max(0, Math.floor((dataMin - padding) * 2) / 2),
    Math.ceil((dataMax + padding) * 2) / 2,
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {metrics.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ${
                metric === m.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-0.5 rounded-full border bg-surface p-0.5">
          {periods.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-2 py-1 text-xs font-medium transition-colors duration-fast ${
                period === p.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      {setOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="stat-label">Serie</span>
          <button
            type="button"
            onClick={() => setSetNumber("best")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ${
              setNumber === "best"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            Mejor
          </button>
          {setOptions.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSetNumber(n)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ${
                setNumber === n
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              S{n}
            </button>
          ))}
          <span className="ml-auto shrink-0 text-xs">
            {serieChangePct === null ? (
              <span className="text-muted-foreground">Sin datos vs. semana pasada</span>
            ) : (
              <span className={`font-medium ${serieChangePct >= 0 ? "text-success" : "text-muted-foreground"}`}>
                {serieChangePct >= 0 ? "+" : ""}
                {serieChangePct.toFixed(1)}% vs. semana pasada
              </span>
            )}
          </span>
        </div>
      )}
      <div className="h-56 w-full" key={`${metric}-${period}-${setNumber}`}>
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No hay datos para esta serie en el periodo elegido.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                domain={yDomain}
                allowDecimals
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={36}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                formatter={(value) => [`${value} kg`, activeMetric.label]}
                cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  boxShadow: "0 8px 24px rgb(0 0 0 / 0.35)",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
                animationDuration={400}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
