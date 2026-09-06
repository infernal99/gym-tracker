import Link from "next/link";
import { BarChart3, ChevronRight, Dumbbell, Flame, Scale, Settings, Trophy, Weight } from "lucide-react";
import { AIMascotAvatar } from "@/components/ai/ai-mascot-avatar";
import { requireProfile, getProfileStats } from "@/lib/services/profile";
import { listWorkoutActivity } from "@/lib/services/training";
import { listWeightEntries } from "@/lib/services/body";
import { listAchievementsWithProgress } from "@/lib/services/achievements";
import { ProfileForm } from "@/components/profile/profile-form";
import { WorkoutHeatmap } from "@/components/profile/workout-heatmap";
import { CalorieCalculatorButton } from "@/components/profile/calorie-calculator-button";
import { StatTile } from "@/components/ui/stat-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [activity, stats, weightEntries, achievements] = await Promise.all([
    listWorkoutActivity(profile.id),
    getProfileStats(profile.id),
    listWeightEntries(profile.id),
    listAchievementsWithProgress(profile.id),
  ]);

  const initials = profile.display_name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const xpIntoLevel = profile.xp % 500;
  const xpProgress = (xpIntoLevel / 500) * 100;
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;
  const currentWeight = weightEntries[weightEntries.length - 1]?.weightKg ?? profile.initial_weight_kg;
  const previousWeight = weightEntries[weightEntries.length - 2]?.weightKg ?? null;
  const weightDelta = previousWeight !== null && currentWeight !== null ? currentWeight - previousWeight : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="fade-up glow-primary space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-primary/30">
            {profile.avatar_url && (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            )}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold tracking-tight">{profile.display_name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold tabular-nums">Nivel {profile.level}</p>
            <p className="stat-label">{profile.xp} XP</p>
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-emphasis"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-right text-xs text-muted-foreground">
            {xpIntoLevel} / 500 XP para el nivel {profile.level + 1}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 fade-up [animation-delay:60ms]">
        <StatTile icon={Dumbbell} label="Entrenamientos" value={stats.totalWorkouts} />
        <StatTile
          icon={Weight}
          label="Volumen"
          value={`${Math.round(stats.totalVolumeKg).toLocaleString("es-ES")} kg`}
        />
        <StatTile icon={Flame} label="Racha" value={`${stats.currentStreak}d`} />
        <StatTile icon={Trophy} label="PRs" value={stats.totalPrs} />
      </div>

      <div className="grid gap-3 fade-up [animation-delay:100ms]">
        <Link
          href="/ai"
          className="card-interactive flex items-center justify-between rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <AIMascotAvatar size={40} />
            <div>
              <p className="stat-label">Gym Tracker AI</p>
              <p className="font-semibold">Tu entrenador digital</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/body"
          className="card-interactive flex items-center justify-between rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Peso corporal</p>
              <p className="font-semibold tabular-nums">
                {currentWeight != null ? `${currentWeight} kg` : "Sin registros"}
                {weightDelta !== null && weightDelta !== 0 && (
                  <span
                    className={`ml-1.5 text-xs font-medium ${weightDelta < 0 ? "text-success" : "text-muted-foreground"}`}
                  >
                    {weightDelta > 0 ? "+" : ""}
                    {weightDelta.toFixed(1)} kg
                  </span>
                )}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/stats"
          className="card-interactive flex items-center justify-between rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muscle-legs/10 text-muscle-legs">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Estadísticas</p>
              <p className="font-semibold">Volumen y exportar</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/achievements"
          className="card-interactive flex items-center justify-between rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Logros</p>
              <p className="font-semibold tabular-nums">
                {unlockedCount} / {achievements.length}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/settings"
          className="card-interactive flex items-center justify-between rounded-xl border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="stat-label">Ajustes</p>
              <p className="font-semibold">Cuenta, privacidad y más</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <CalorieCalculatorButton profile={profile} />

      <Card className="fade-up [animation-delay:140ms]">
        <CardHeader>
          <CardTitle className="text-base">Actividad</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkoutHeatmap sessions={activity} />
        </CardContent>
      </Card>

      <Card className="fade-up [animation-delay:180ms]">
        <CardHeader>
          <CardTitle>Editar perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile} />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Datos e imágenes de ejercicios por{" "}
        <a
          href="https://repdb.co"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          RepDB
        </a>
      </p>
    </div>
  );
}
