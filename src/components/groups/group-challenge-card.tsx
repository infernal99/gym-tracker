"use client";

import { CalendarClock, CheckCircle2, Trophy } from "lucide-react";
import type { GroupChallenge } from "@/lib/services/group-challenges";
import { groupChallengeUnit, type GroupChallengeMetric } from "@/lib/validation/group-challenges";
import { daysRemaining } from "@/lib/challenge-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const MEDALS = ["🥇", "🥈", "🥉"];

export function GroupChallengeCard({ challenge }: { challenge: GroupChallenge }) {
  const unit = groupChallengeUnit[challenge.metric as GroupChallengeMetric] ?? "";
  const completed = challenge.status === "completed";
  const remaining = daysRemaining(challenge.endDate);
  const expired = !completed && remaining < 0;

  const format = (v: number) => (unit === "días" || unit === "entrenos" ? Math.round(v) : v.toLocaleString("es-ES"));

  return (
    <div
      className={`space-y-3 rounded-xl border p-4 ${
        completed ? "border-success/30 bg-success/5" : expired ? "border-destructive/20 bg-destructive/5" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate font-semibold">
            {completed && <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
            {challenge.name}
          </p>
          <p className="text-sm text-muted-foreground">
            {challenge.exerciseName ?? groupChallengeUnit[challenge.metric as GroupChallengeMetric]}
            {challenge.isCollective ? " · Colectivo" : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          {completed
            ? "Completado"
            : expired
              ? "Plazo terminado"
              : remaining === 0
                ? "Termina hoy"
                : `${remaining} d`}
        </div>
      </div>

      {challenge.isCollective ? (
        <div className="space-y-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-[width] duration-emphasis ease-out ${completed ? "bg-success" : "bg-primary"}`}
              style={{ width: `${Math.min(100, (challenge.collectiveTotal / challenge.targetValue) * 100)}%` }}
            />
          </div>
          <p className="text-sm tabular-nums text-muted-foreground">
            {format(challenge.collectiveTotal)} / {format(challenge.targetValue)} {unit} entre todos
          </p>
        </div>
      ) : (
        <p className="text-sm tabular-nums text-muted-foreground">
          Meta: {format(challenge.targetValue)} {unit}
        </p>
      )}

      <div className="divide-y divide-border/60">
        {challenge.participants.map((p, i) => {
          const reached = p.currentValue >= challenge.targetValue;
          return (
            <div key={p.id} className="flex items-center gap-2.5 py-2">
              <span className="w-5 shrink-0 text-center text-sm text-muted-foreground">
                {!challenge.isCollective && reached && i < 3 ? MEDALS[i] : i + 1}
              </span>
              <Avatar className="h-7 w-7 shrink-0">
                {p.avatarUrl && <AvatarImage src={p.avatarUrl} />}
                <AvatarFallback>{p.displayName[0]}</AvatarFallback>
              </Avatar>
              <p className="min-w-0 flex-1 truncate text-sm">{p.displayName}</p>
              <span className="flex shrink-0 items-center gap-1 text-sm font-medium tabular-nums">
                {reached && !challenge.isCollective && <Trophy className="h-3.5 w-3.5 text-primary" />}
                {format(p.currentValue)} {unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
