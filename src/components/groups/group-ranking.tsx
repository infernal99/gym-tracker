"use client";

import { useRef, useState } from "react";
import { Flame } from "lucide-react";
import type { GroupMemberStats } from "@/lib/services/groups";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFlipList } from "@/lib/hooks/use-flip-list";

const metrics = [
  {
    key: "volume",
    label: "Volumen",
    value: (m: GroupMemberStats) => m.volumeThisWeekKg,
    format: (v: number) => `${Math.round(v).toLocaleString("es-ES")} kg`,
    caption: "esta semana",
  },
  {
    key: "workouts",
    label: "Entrenos",
    value: (m: GroupMemberStats) => m.workoutsThisWeek,
    format: (v: number) => String(v),
    caption: "esta semana",
  },
  {
    key: "streak",
    label: "Racha",
    value: (m: GroupMemberStats) => m.currentStreak,
    format: (v: number) => `${v} d`,
    caption: "días seguidos",
  },
  {
    key: "prs",
    label: "PRs",
    value: (m: GroupMemberStats) => m.prsThisWeek,
    format: (v: number) => String(v),
    caption: "esta semana",
  },
] as const;

const MEDALS = ["🥇", "🥈", "🥉"];

// One metric at a time, like the friends leaderboard — but here a member can
// have chosen not to share the figure at all, which is a different thing
// from a real zero, so it's shown as "Oculto" and sinks to the bottom
// instead of ranking as if it were nothing.
export function GroupRanking({ members }: { members: GroupMemberStats[] }) {
  const [metricKey, setMetricKey] = useState<(typeof metrics)[number]["key"]>("volume");
  const metric = metrics.find((m) => m.key === metricKey)!;
  const listRef = useRef<HTMLDivElement>(null);
  useFlipList(listRef, metricKey);

  const ranked = [...members].sort((a, b) => {
    const av = metric.value(a);
    const bv = metric.value(b);
    if (av === null && bv === null) return a.displayName.localeCompare(b.displayName);
    if (av === null) return 1;
    if (bv === null) return -1;
    return bv - av || a.displayName.localeCompare(b.displayName);
  });

  let rank = 0;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {metrics.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetricKey(m.key)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors duration-fast ${
              metricKey === m.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div ref={listRef} className="divide-y divide-border/60">
        {ranked.map((member) => {
          const value = metric.value(member);
          const hidden = value === null;
          if (!hidden) rank += 1;
          const position = hidden ? null : rank;
          return (
            <div
              key={member.id}
              data-flip-key={member.id}
              className={`flex items-center gap-3 py-2.5 ${member.isMe ? "-mx-2 rounded-lg bg-primary/5 px-2" : ""}`}
            >
              <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                {position && !hidden && value! > 0 && position <= 3 ? MEDALS[position - 1] : (position ?? "—")}
              </span>
              <Avatar className="h-9 w-9 shrink-0">
                {member.avatarUrl && <AvatarImage src={member.avatarUrl} />}
                <AvatarFallback>{member.displayName[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {member.displayName}
                  {member.isMe && <span className="ml-1 text-xs text-primary">(tú)</span>}
                </p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  Nivel {member.level}
                  {metricKey !== "streak" && member.currentStreak !== null && member.currentStreak > 0 && (
                    <>
                      · <Flame className="h-3 w-3 text-primary" />
                      {member.currentStreak}d
                    </>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-right">
                {hidden ? (
                  <p className="text-sm text-muted-foreground">Oculto</p>
                ) : (
                  <>
                    <p className="font-semibold tabular-nums">{metric.format(value)}</p>
                    <p className="stat-label">{metric.caption}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
