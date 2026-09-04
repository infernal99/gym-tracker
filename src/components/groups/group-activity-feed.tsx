import { Flame, Dumbbell, Trophy, Target, Star } from "lucide-react";
import type { GroupActivityEntry } from "@/lib/services/group-activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ICONS = {
  workout_completed: Dumbbell,
  new_pr: Flame,
  achievement_unlocked: Trophy,
  goal_completed: Target,
  challenge_won: Trophy,
  level_up: Star,
} as const;

function describe(entry: GroupActivityEntry): string {
  const m = entry.metadata;
  switch (entry.type) {
    case "workout_completed":
      return `completó su entrenamiento${m.sessionName ? ` de ${m.sessionName}` : ""}.`;
    case "new_pr":
      return `consiguió un nuevo PR en ${m.exerciseName}: ${m.weightKg} kg × ${m.reps}.`;
    case "achievement_unlocked":
      return `desbloqueó el logro «${m.name}».`;
    case "goal_completed":
      return `completó su objetivo «${m.title}».`;
    case "challenge_won":
      return `ganó el reto «${m.challengeName}».`;
    case "level_up":
      return `subió al nivel ${m.level}.`;
    default:
      return "tuvo actividad reciente.";
  }
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}

// Read-only, chronological — no comments/likes, just "what's been
// happening", scoped to whatever each member chose to share (see the
// service and its RLS policy for the actual gating).
export function GroupActivityFeed({ entries }: { entries: GroupActivityEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay actividad en este grupo.</p>;
  }

  return (
    <div className="divide-y divide-border/60">
      {entries.map((entry) => {
        const Icon = ICONS[entry.type] ?? Dumbbell;
        return (
          <div key={entry.id} className="flex items-start gap-2.5 py-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} />}
              <AvatarFallback>{entry.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-medium">{entry.displayName}</span>{" "}
                <span className="text-muted-foreground">{describe(entry)}</span>
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</p>
            </div>
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          </div>
        );
      })}
    </div>
  );
}
