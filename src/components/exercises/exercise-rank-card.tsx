import { Award } from "lucide-react";
import type { ExerciseRank, ExerciseRankTier } from "@/lib/calculations/exercise-rank";
import { cn } from "@/lib/utils";

const TIER_CLASSES: Record<ExerciseRankTier, string> = {
  Principiante: "bg-muted text-muted-foreground",
  Novato: "bg-primary/10 text-primary",
  Intermedio: "bg-primary/20 text-primary",
  Avanzado: "bg-success/15 text-success",
  Élite: "bg-primary text-primary-foreground",
};

export function ExerciseRankCard({
  rank,
  totalSets,
  prCount,
}: {
  rank: ExerciseRank;
  totalSets: number;
  prCount: number;
}) {
  const progressPct = (rank.xpIntoLevel / rank.xpPerLevel) * 100;

  return (
    <div className="fade-up flex items-center gap-3 rounded-2xl border bg-card p-4">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl",
          TIER_CLASSES[rank.tier],
        )}
      >
        <Award className="h-4 w-4" />
        <span className="text-[0.65rem] font-bold leading-none">{rank.level}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold">{rank.tier}</p>
          <p className="stat-label">
            {totalSets} series{prCount > 0 ? ` · ${prCount} PR${prCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-emphasis"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-right text-xs text-muted-foreground">
          Nivel {rank.level + 1} en {rank.xpPerLevel - rank.xpIntoLevel} XP
        </p>
      </div>
    </div>
  );
}
