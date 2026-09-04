import Link from "next/link";
import { Flame, Target, TrendingUp, RotateCcw, Trophy } from "lucide-react";
import type { ChallengeTone, DailyChallenge } from "@/lib/services/daily-challenge";

const TONE_ICONS: Record<ChallengeTone, React.ElementType> = {
  near_pr: Target,
  just_set_pr: Trophy,
  stalled: Flame,
  improving: TrendingUp,
  bounce_back: RotateCcw,
};

// The day's one concrete reference, built from real sessions. Sits above the
// "empezar entrenamiento" call to action so the number you're chasing is the
// last thing read before starting. Phrased as a reference, never a target the
// user has failed if they don't hit it.
export function DailyChallengeCard({
  challenge,
  exerciseHref,
}: {
  challenge: DailyChallenge;
  exerciseHref: string;
}) {
  const Icon = TONE_ICONS[challenge.tone];
  const { lastBest, personalBest, suggestion } = challenge;

  return (
    <div className="fade-up rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <p className="stat-label flex items-center gap-1.5 text-primary">
        <Icon className="h-3.5 w-3.5" />
        Tu reto de hoy
      </p>

      <Link href={exerciseHref} className="mt-1 block">
        <h2 className="text-xl font-bold tracking-tight">{challenge.exercise.name}</h2>
      </Link>
      <p className="mt-0.5 text-sm font-medium">{challenge.headline}</p>
      <p className="mt-1 text-sm text-muted-foreground">{challenge.body}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border bg-card px-3 py-2">
          <p className="stat-label">La última vez</p>
          <p className="text-lg font-bold tabular-nums">
            {lastBest.weightKg} kg × {lastBest.reps}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(lastBest.date).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </p>
        </div>
        <div className="rounded-xl border bg-card px-3 py-2">
          <p className="stat-label">Referencia</p>
          <p className="text-lg font-bold tabular-nums text-primary">
            {suggestion.weightKg} kg × {suggestion.reps}
          </p>
          <p className="text-xs text-muted-foreground">
            {personalBest
              ? `Récord: ${personalBest.weightKg} kg × ${personalBest.reps}`
              : "o iguala tu marca"}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Es una referencia, no una obligación: mantener el peso o bajar también es entrenar bien.
      </p>
    </div>
  );
}
