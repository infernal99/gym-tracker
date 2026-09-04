"use client";

import { useRef, useState } from "react";
import { Flame } from "lucide-react";
import type { FriendStats } from "@/lib/services/friends";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useFlipList } from "@/lib/hooks/use-flip-list";

const metrics = [
  {
    key: "volume",
    label: "Volumen",
    value: (e: FriendStats) => e.volumeThisWeekKg,
    format: (v: number) => `${Math.round(v).toLocaleString("es-ES")} kg`,
    caption: "esta semana",
  },
  {
    key: "workouts",
    label: "Entrenos",
    value: (e: FriendStats) => e.workoutsThisWeek,
    format: (v: number) => String(v),
    caption: "esta semana",
  },
  {
    key: "streak",
    label: "Racha",
    value: (e: FriendStats) => e.currentStreak,
    format: (v: number) => `${v} d`,
    caption: "días seguidos",
  },
  {
    key: "xp",
    label: "Nivel",
    value: (e: FriendStats) => e.xp,
    format: (v: number) => `${v.toLocaleString("es-ES")} XP`,
    caption: "total",
  },
] as const;

const MEDALS = ["🥇", "🥈", "🥉"];

// Ranks the user against their friends on one metric at a time. Weekly
// figures rather than all-time ones, so someone who just joined can still
// win a week — an all-time board would be decided permanently on day one.
export function FriendsLeaderboard({ entries }: { entries: FriendStats[] }) {
  const [metricKey, setMetricKey] = useState<(typeof metrics)[number]["key"]>("volume");
  const metric = metrics.find((m) => m.key === metricKey)!;
  const listRef = useRef<HTMLDivElement>(null);
  useFlipList(listRef, metricKey);

  const ranked = [...entries].sort((a, b) => {
    const diff = metric.value(b) - metric.value(a);
    return diff !== 0 ? diff : a.displayName.localeCompare(b.displayName);
  });

  const myPosition = ranked.findIndex((e) => e.isMe) + 1;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between gap-2">
          <p className="stat-label">Clasificación</p>
          {myPosition > 0 && ranked.length > 1 && (
            <p className="text-xs text-muted-foreground">
              Vas {myPosition}º de {ranked.length}
            </p>
          )}
        </div>

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
          {ranked.map((entry, index) => {
            const value = metric.value(entry);
            return (
              <div
                key={entry.id}
                data-flip-key={entry.id}
                className={`flex items-center gap-3 py-2.5 ${entry.isMe ? "-mx-2 rounded-lg bg-primary/5 px-2" : ""}`}
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                  {value > 0 && index < 3 ? MEDALS[index] : index + 1}
                </span>
                <Avatar className="h-9 w-9 shrink-0">
                  {entry.avatarUrl && <AvatarImage src={entry.avatarUrl} />}
                  <AvatarFallback>{entry.displayName[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.displayName}
                    {entry.isMe && <span className="ml-1 text-xs text-primary">(tú)</span>}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    Nivel {entry.level}
                    {metricKey !== "streak" && entry.currentStreak > 0 && (
                      <>
                        · <Flame className="h-3 w-3 text-primary" />
                        {entry.currentStreak}d
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{metric.format(value)}</p>
                  <p className="stat-label">{metric.caption}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
