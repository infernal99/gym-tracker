// Compact "+12% / nuevo / igual" indicator shared by any week-over-week (or
// baseline-over-time) comparison in the app. previous === 0 reads as "no
// baseline yet" rather than a divide-by-zero, so a first-ever week of data
// shows as "nuevo" instead of an infinite percentage.
export function DeltaBadge({
  current,
  previous,
  unit = "",
}: {
  current: number;
  previous: number;
  unit?: string;
}) {
  if (previous === 0) {
    if (current === 0) return <span className="text-xs text-muted-foreground">—</span>;
    return <span className="text-xs font-medium text-success">nuevo</span>;
  }
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-muted-foreground">igual</span>;
  const pct = Math.round((diff / previous) * 100);
  return (
    <span className={`text-xs font-medium ${diff > 0 ? "text-success" : "text-muted-foreground"}`}>
      {diff > 0 ? "+" : ""}
      {Math.abs(pct) >= 1000 ? `${diff > 0 ? "" : "-"}${Math.abs(diff)}${unit}` : `${pct}%`}
    </span>
  );
}
