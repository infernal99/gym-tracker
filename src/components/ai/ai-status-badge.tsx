import { cn } from "@/lib/utils";

export function AIStatusBadge({ available }: { available: boolean | null }) {
  if (available === null) {
    return <span className="text-xs text-muted-foreground">Comprobando...</span>;
  }

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
    </span>
  );
}
