import { TrendingDown, TrendingUp } from "lucide-react";

export function StatTile({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean } | null;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3.5">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {trend && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend.positive ? "text-success" : "text-muted-foreground"
            }`}
          >
            {trend.positive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.value}
          </span>
        )}
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label mt-0.5">{label}</p>
      </div>
    </div>
  );
}
