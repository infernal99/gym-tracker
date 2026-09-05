"use client";

import Link from "next/link";
import { Line, LineChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseProgressChart } from "@/lib/ai/charts";

export function ExerciseProgressChartCard({ chart }: { chart: ExerciseProgressChart }) {
  const data = chart.points.map((p) => ({
    date: new Date(p.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
    e1rm: p.e1rm,
  }));

  const values = data.map((d) => d.e1rm);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  const padding = spread > 0 ? spread * 0.2 : Math.max(max * 0.1, 1);
  const positive = (chart.changePct ?? 0) >= 0;

  return (
    <div
      className={cn(
        "fade-up ml-9 space-y-2 rounded-2xl border bg-card p-4",
        // A soft, static glow — not a looping pulse — when the trend is
        // clearly positive, so real progress reads as a small win to
        // notice, not a constant blinking distraction.
        positive && chart.changePct !== null && chart.changePct >= 3
          ? "border-success/40 shadow-[0_0_24px_-8px_var(--success)]"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </span>
          <p className="font-semibold leading-tight">{chart.exerciseName}</p>
        </div>
        {chart.changePct !== null && (
          <span
            className={cn(
              "text-sm font-semibold tabular-nums",
              positive ? "text-success" : "text-muted-foreground",
            )}
          >
            {positive ? "+" : ""}
            {chart.changePct}%
          </span>
        )}
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <YAxis domain={[min - padding, max + padding]} hide />
            <Tooltip
              formatter={(value) => [`${value} kg`, "1RM estimado"]}
              labelFormatter={(label) => label}
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
              dataKey="e1rm"
              stroke="var(--primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 2 }}
              animationDuration={500}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="w-full"
        render={<Link href={`/exercises/${chart.exerciseSlug}`} />}
      >
        Ver progreso
      </Button>
    </div>
  );
}
