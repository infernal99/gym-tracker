import { requireProfile } from "@/lib/services/profile";
import { listAchievementsWithProgress } from "@/lib/services/achievements";
import { Card } from "@/components/ui/card";
import { AchievementIcon } from "@/components/achievements/achievement-icon";

const categoryLabels: Record<string, string> = {
  consistency: "Constancia",
  strength: "Fuerza",
  volume: "Volumen",
  goals: "Objetivos",
};

export default async function AchievementsPage() {
  const profile = await requireProfile();
  const achievements = await listAchievementsWithProgress(profile.id);

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logros</h1>
          <p className="text-muted-foreground">
            {unlockedCount} / {achievements.length} desbloqueados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {achievements.map((a) => {
          const unlocked = !!a.unlockedAt;
          return (
            <Card
              key={a.id}
              className={`flex-row items-center gap-4 p-4 ${
                unlocked ? "" : "bg-card/60"
              }`}
            >
              {/* Unlocked: a white medallion with a solid glyph, lit like the
                  primary buttons. Locked: an outline on flat grey. */}
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  unlocked
                    ? "btn-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground shadow-[inset_0_1px_2px_oklch(0_0_0/40%)]"
                }`}
              >
                <AchievementIcon code={a.code} unlocked={unlocked} className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold ${unlocked ? "" : "text-muted-foreground"}`}>
                  {a.name}
                </p>
                <p className="truncate text-sm text-muted-foreground">{a.description}</p>
                {!unlocked && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-emphasis"
                      style={{ width: `${a.progress}%` }}
                    />
                  </div>
                )}
              </div>
              <span className="stat-label shrink-0">{categoryLabels[a.category] ?? a.category}</span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
