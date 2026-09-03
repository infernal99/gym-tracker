"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ExerciseProgressPoint } from "@/lib/services/training";

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

export function ExerciseChart({ points }: { points: ExerciseProgressPoint[] }) {
  const [metric, setMetric] = useState<(typeof metrics)[number]["key"]>("e1rm");
  const [period, setPeriod] = useState<(typeof periods)[number]["key"]>("all");
  const activeMetric = metrics.find((m) => m.key === metric)!;
  const activePeriod = periods.find((p) => p.key === period)!;

  const cutoff =
    activePeriod.days !== null ? Date.now() - activePeriod.days * 86_400_000 : null;
  const filteredPoints =
    cutoff !== null ? points.filter((p) => new Date(p.date).getTime() >= cutoff) : points;

  const data = filteredPoints.map((p) => ({
    date: new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    value: p[metric],
  }));

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
      <div className="h-56 w-full" key={`${metric}-${period}`}>
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
      </div>
    </div>
  );
}
