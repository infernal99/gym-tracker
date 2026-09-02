import Link from "next/link";
import { Dumbbell, Flame, Moon, Play, TrendingUp, Trophy } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getDashboardStats } from "@/lib/services/dashboard";
import { listTrainingDays } from "@/lib/services/training";
import { startWorkoutAction } from "@/lib/actions/training";
import { AlternateDayCard } from "@/components/training/alternate-day-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none tabular-nums">{value}</p>
          <p className="truncate text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [stats, trainingDays] = await Promise.all([
    getDashboardStats(profile.id, profile.active_template_id),
    profile.active_template_id ? listTrainingDays(profile.active_template_id) : Promise.resolve([]),
  ]);

  const otherDays = trainingDays.filter((d) => d.id !== stats.pendingDay?.id);

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hoy</h1>
        <p className="capitalize text-muted-foreground">{today}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {stats.activeSession ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entrenamiento en curso</p>
                <p className="text-xl font-semibold">{stats.activeSession.name}</p>
              </div>
              <Button
                render={<Link href={`/train/${stats.activeSession.id}`} />}
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
              <div className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <p className="text-xl font-semibold">Día de descanso</p>
              </div>
              {stats.nextTrainingDayIfResting && (
                <p className="text-sm text-muted-foreground">
                  Tu siguiente entrenamiento: {stats.nextTrainingDayIfResting.name}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Entrenamiento pendiente</p>
                  <p className="truncate text-2xl font-semibold tracking-tight">
                    {stats.pendingDay.name}
                  </p>
                  {stats.activeTemplateName && (
                    <p className="text-sm text-muted-foreground">{stats.activeTemplateName}</p>
                  )}
                </div>
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
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Otros días de tu rutina</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {otherDays.map((day) => (
              <AlternateDayCard key={day.id} day={day} />
            ))}
          </div>
        </div>
      )}

      {stats.lastSession && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Último entrenamiento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.lastSession.name} ·{" "}
            {new Date(stats.lastSession.completed_at!).toLocaleDateString("es-ES")}
            {stats.lastSession.duration_seconds
              ? ` · ${Math.round(stats.lastSession.duration_seconds / 60)}min`
              : ""}{" "}
            · {stats.lastSession.total_volume_kg} kg de volumen
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progreso reciente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
              <Trophy className="h-4 w-4" />
            </span>
            {stats.prsThisWeek} PR{stats.prsThisWeek === 1 ? "" : "s"} esta semana
          </div>
          {stats.volumeChangePct !== null && (
            <div className="flex items-center gap-3 text-sm">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  stats.volumeChangePct >= 0
                    ? "bg-success/10 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
              </span>
              {stats.volumeChangePct >= 0 ? "+" : ""}
              {stats.volumeChangePct.toFixed(1)}% de volumen esta semana
            </div>
          )}
          <div className="flex items-center gap-3 text-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Flame className="h-4 w-4" />
            </span>
            {stats.workoutsThisWeek} entrenamiento{stats.workoutsThisWeek === 1 ? "" : "s"} esta
            semana · racha de {stats.currentStreak}d
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard icon={Trophy} label="Entrenamientos totales" value={stats.totalWorkouts} />
        <StatCard icon={Flame} label="Este mes" value={stats.workoutsThisMonth} />
        <StatCard icon={TrendingUp} label="Racha actual" value={`${stats.currentStreak}d`} />
      </div>
    </div>
  );
}
