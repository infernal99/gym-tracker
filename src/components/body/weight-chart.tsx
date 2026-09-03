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
import type { WeightEntry } from "@/lib/services/body";

const periods = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "1y", label: "1A", days: 365 },
  { key: "all", label: "Todo", days: null },
] as const;

export function WeightChart({ entries }: { entries: WeightEntry[] }) {
  const [period, setPeriod] = useState<(typeof periods)[number]["key"]>("3m");
  const activePeriod = periods.find((p) => p.key === period)!;

  const cutoff = activePeriod.days !== null ? Date.now() - activePeriod.days * 86_400_000 : null;
  const filtered =
    cutoff !== null ? entries.filter((e) => new Date(e.recordedAt).getTime() >= cutoff) : entries;

  const data = filtered.map((e) => ({
    date: new Date(e.recordedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    value: e.weightKg,
  }));

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-0.5 rounded-full border bg-surface p-0.5">
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
      <div className="h-56 w-full" key={period}>
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Registra al menos dos pesos para ver el gráfico.
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
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={36}
                domain={["dataMin - 1", "dataMax + 1"]}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                formatter={(value) => [`${value} kg`, "Peso"]}
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
