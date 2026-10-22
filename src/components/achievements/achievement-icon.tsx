import type { Icon } from "@phosphor-icons/react";
import {
  Barbell,
  CalendarCheck,
  Crown,
  Fire,
  Lightning,
  Medal,
  Target,
  Trophy,
} from "@phosphor-icons/react/ssr";

// Achievements carry an emoji in the database, which is fine for the feed
// and notifications but clashes with the monochrome UI here. Each one
// gets a drawn glyph instead, picked by code; anything new falls back to
// a medal until it's given its own.
const iconByCode: Record<string, Icon> = {
  first_workout: Trophy,
  streak_7: Fire,
  workouts_30: Lightning,
  weeks_10: CalendarCheck,
  first_goal: Target,
  first_pr: Barbell,
  prs_10: Crown,
  volume_10000: Barbell,
  volume_100000: Crown,
};

export function AchievementIcon({
  code,
  unlocked,
  className,
}: {
  code: string;
  unlocked: boolean;
  className?: string;
}) {
  const Glyph = iconByCode[code] ?? Medal;
  return <Glyph weight={unlocked ? "fill" : "regular"} className={className} />;
}
