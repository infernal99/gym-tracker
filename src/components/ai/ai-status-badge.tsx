import { cn } from "@/lib/utils";

export function AIStatusBadge({
  available,
  usage,
}: {
  available: boolean | null;
  usage?: { usedToday: number; dailyLimit: number } | null;
}) {
  if (available === null) {
    return <span className="text-xs text-muted-foreground">Comprobando...</span>;
  }

  const nearLimit = Boolean(usage && usage.usedToday >= usage.dailyLimit * 0.8);

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        available ? "text-success" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          available ? "bg-success" : "bg-muted-foreground",
        )}
      />
      {available ? "En línea" : "No disponible"}
      {available && usage && (
        <span className={cn("font-normal text-muted-foreground", nearLimit && "text-destructive")}>
          · {usage.usedToday}/{usage.dailyLimit} hoy
        </span>
      )}
    </span>
  );
}
