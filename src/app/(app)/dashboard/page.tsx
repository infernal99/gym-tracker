import Link from "next/link";
import { Flame, Dumbbell, ListChecks, TrendingUp } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getDashboardStats } from "@/lib/services/dashboard";
import { primaryGoalLabels } from "@/lib/validation/auth";
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const stats = await getDashboardStats(profile.id);

  const nextDay = stats.activeTemplate?.workout_template_days
    ?.filter((d) => !d.is_rest_day)
    .sort((a, b) => a.day_order - b.day_order)[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {profile.display_name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground">{primaryGoalLabels[profile.primary_goal]}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={Dumbbell} label="Entrenamientos totales" value={stats.totalWorkouts} />
        <StatCard icon={ListChecks} label="Esta semana" value={stats.workoutsThisWeek} />
        <StatCard icon={TrendingUp} label="Este mes" value={stats.workoutsThisMonth} />
        <StatCard icon={Flame} label="Racha actual" value={`${stats.currentStreak}d`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entrenamiento</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.activeTemplate && nextDay ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoy toca</p>
                <p className="text-xl font-semibold">{nextDay.name}</p>
                <p className="text-sm text-muted-foreground">{stats.activeTemplate.name}</p>
              </div>
              <Button
                render={<Link href={`/routines/${stats.activeTemplate.id}`} />}
                className="w-full sm:w-auto"
              >
                Ver rutina
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-muted-foreground">Aún no tienes una rutina activa.</p>
              <Button render={<Link href="/routines" />}>Crear rutina</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {stats.lastSession && (
        <Card>
          <CardHeader>
            <CardTitle>Último entrenamiento</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {stats.lastSession.name} ·{" "}
            {new Date(stats.lastSession.completed_at!).toLocaleDateString("es-ES")} ·{" "}
            {stats.lastSession.total_volume_kg} kg de volumen
          </CardContent>
        </Card>
      )}
    </div>
  );
}
