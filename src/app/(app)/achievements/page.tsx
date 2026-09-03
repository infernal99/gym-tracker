import { requireProfile } from "@/lib/services/profile";
import { listAchievementsWithProgress } from "@/lib/services/achievements";
import { Card } from "@/components/ui/card";

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
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Logros</h1>
          <p className="text-muted-foreground">
            {unlockedCount} / {achievements.length} desbloqueados
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 fade-up [animation-delay:60ms]">
        {achievements.map((a) => {
          const unlocked = !!a.unlockedAt;
          return (
            <Card
              key={a.id}
              className={`flex-row items-center gap-4 p-4 ${
                unlocked ? "border-primary/30 bg-primary/5" : ""
              }`}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                  unlocked ? "bg-primary/15" : "bg-muted grayscale opacity-50"
                }`}
              >
                {a.icon}
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
