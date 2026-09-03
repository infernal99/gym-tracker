import Link from "next/link";
import { Moon, Play } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getDashboardStats } from "@/lib/services/dashboard";
import { getWeeklySummary } from "@/lib/services/weekly-summary";
import { listTrainingDays } from "@/lib/services/training";
import { startWorkoutAction } from "@/lib/actions/training";
import { AlternateDayCard } from "@/components/training/alternate-day-card";
import { MotivationBanner } from "@/components/dashboard/motivation-banner";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { InstallBanner } from "@/components/pwa/install-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function greetingForHour(hour: number) {
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [stats, trainingDays, weeklySummary] = await Promise.all([
    getDashboardStats(profile.id, profile.active_template_id),
    profile.active_template_id ? listTrainingDays(profile.active_template_id) : Promise.resolve([]),
    getWeeklySummary(profile.id),
  ]);

  const otherDays = trainingDays.filter((d) => d.id !== stats.pendingDay?.id);
  const firstName = profile.display_name.split(" ")[0];
  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const today = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8">
      <InstallBanner />
      <MotivationBanner summary={weeklySummary} />
      <div className="fade-up">
        <p className="text-muted-foreground">
          {greeting}, {firstName} 👋
        </p>
        <h1 className="mt-0.5 text-2xl font-semibold capitalize tracking-tight">{today}</h1>
      </div>

      <Card className="fade-up glow-primary overflow-hidden [animation-delay:60ms]">
        <CardContent className="pt-6">
          {stats.activeSession ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="stat-label">Entrenamiento en curso</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {stats.activeSession.name}
                </p>
              </div>
              <Button
                render={<Link href={`/train/${stats.activeSession.id}`} />}
                size="lg"
                className="w-full sm:w-auto"
              >
                <Play className="h-4 w-4" />
                Continuar
              </Button>
            </div>
          ) : !profile.active_template_id ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground">Todavía no tienes ninguna rutina activa.</p>
              <Button render={<Link href="/my-routine/choose" />}>Elegir rutina</Button>
            </div>
          ) : !stats.pendingDay ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground">Tu rutina activa todavía no tiene días.</p>
              <Button render={<Link href="/my-routine" />}>Ver mi rutina</Button>
            </div>
          ) : stats.pendingDay.is_rest_day ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Moon className="h-6 w-6" />
                </div>
                <div>
                  <p className="stat-label">Hoy</p>
                  <p className="text-2xl font-semibold tracking-tight">Día de descanso</p>
                </div>
              </div>
              {stats.nextTrainingDayIfResting && (
                <p className="text-sm text-muted-foreground">
                  Tu siguiente entrenamiento: {stats.nextTrainingDayIfResting.name}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="stat-label text-primary">Hoy</p>
                <p className="mt-1 truncate text-3xl font-bold tracking-tight sm:text-4xl">
                  {stats.pendingDay.name}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {stats.activeTemplateName && `${stats.activeTemplateName} · `}
                  {stats.pendingDayExerciseCount} ejercicios · {stats.pendingDaySetCount} series
                </p>
              </div>
              <form action={startWorkoutAction.bind(null, stats.pendingDay.id, true)}>
                <Button type="submit" size="lg" className="w-full">
                  <Play className="h-4 w-4" />
                  Empezar entrenamiento
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {otherDays.length > 0 && (
        <div className="fade-up [animation-delay:100ms]">
          <p className="stat-label mb-2">Otros días de tu rutina</p>
          <div className="grid grid-cols-2 gap-2">
            {otherDays.map((day) => (
              <AlternateDayCard key={day.id} day={day} />
            ))}
          </div>
        </div>
      )}

      <div className="fade-up [animation-delay:140ms]">
        <WeeklySummaryCard summary={weeklySummary} />
      </div>

      {stats.lastSession && (
        <div className="fade-up flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm [animation-delay:180ms]">
          <div className="min-w-0">
            <p className="truncate font-medium">{stats.lastSession.name}</p>
            <p className="text-muted-foreground">
              {new Date(stats.lastSession.completed_at!).toLocaleDateString("es-ES")}
              {stats.lastSession.duration_seconds
                ? ` · ${Math.round(stats.lastSession.duration_seconds / 60)} min`
                : ""}{" "}
              · {stats.lastSession.total_volume_kg} kg
            </p>
          </div>
          <span className="stat-label shrink-0">Último</span>
        </div>
      )}
    </div>
  );
}
