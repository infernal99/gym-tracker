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
import type { MeasurementEntry } from "@/lib/services/body";

const fields = [
  { key: "chestCm", label: "Pecho" },
  { key: "waistCm", label: "Cintura" },
  { key: "hipCm", label: "Cadera" },
  { key: "armCm", label: "Brazo" },
  { key: "forearmCm", label: "Antebrazo" },
  { key: "thighCm", label: "Muslo" },
  { key: "calfCm", label: "Gemelo" },
] as const;

// Evolution over time for one measurement at a time — mirrors WeightChart's
// shape, but needs a metric picker first since a measurement entry holds
// seven independent numbers instead of weight's single value.
export function MeasurementChart({ entries }: { entries: MeasurementEntry[] }) {
  const availableFields = fields.filter((f) => entries.some((e) => e[f.key] != null));
  const [field, setField] = useState<(typeof fields)[number]["key"] | null>(availableFields[0]?.key ?? null);

  const data = useMemo(() => {
    if (!field) return [];
    return [...entries]
      .filter((e) => e[field] != null)
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .map((e) => ({
        date: new Date(e.recordedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        value: e[field] as number,
      }));
  }, [entries, field]);

  const values = data.map((d) => d.value);
  const dataMin = values.length > 0 ? Math.min(...values) : 0;
  const dataMax = values.length > 0 ? Math.max(...values) : 1;
  const spread = dataMax - dataMin;
  const padding = spread > 0 ? Math.max(spread * 0.2, 0.5) : 1;
  const yDomain: [number, number] = [
    Math.max(0, Math.round((dataMin - padding) * 2) / 2),
    Math.round((dataMax + padding) * 2) / 2,
  ];

  if (availableFields.length === 0) {
    return <p className="text-sm text-muted-foreground">Añade medidas para ver su evolución aquí.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {availableFields.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setField(f.key)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ${
              field === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="h-52 w-full" key={field ?? ""}>
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Registra al menos dos medidas de este punto para ver el gráfico.
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
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={32}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                formatter={(value) => [`${value} cm`, fields.find((f) => f.key === field)?.label]}
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
