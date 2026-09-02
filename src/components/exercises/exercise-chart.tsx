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

export function ExerciseChart({ points }: { points: ExerciseProgressPoint[] }) {
  const [metric, setMetric] = useState<(typeof metrics)[number]["key"]>("e1rm");
  const activeMetric = metrics.find((m) => m.key === metric)!;

  const data = points.map((p) => ({
    date: new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    value: p[metric],
  }));

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={`rounded-xl px-2.5 py-1 text-xs font-medium transition-colors ${
              metric === m.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} width={36} />
            <Tooltip
              formatter={(value) => [`${value} kg`, activeMetric.label]}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
