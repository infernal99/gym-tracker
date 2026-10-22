import Link from "next/link";
import { CalendarPlus, Moon, NotebookPen } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { getDashboardStats } from "@/lib/services/dashboard";
import { getWeeklySummary } from "@/lib/services/weekly-summary";
import { getInsights } from "@/lib/services/insights";
import { getDailyChallenge } from "@/lib/services/daily-challenge";
import { listTrainingDays } from "@/lib/services/training";
import { listPendingShares } from "@/lib/services/routines";
import { openLogAction } from "@/lib/actions/training";
import { AlternateDayCard } from "@/components/training/alternate-day-card";
import { MotivationBanner } from "@/components/dashboard/motivation-banner";
import { SharedRoutineCard } from "@/components/routines/shared-routine-card";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
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
  // Everything starts at once. The daily challenge needs today's planned
  // exercises, which stats works out, so it gets them as a promise and runs
  // its own history query in the meantime instead of queueing behind stats.
  const statsPromise = getDashboardStats(profile.id, profile.active_template_id);
  const [stats, trainingDays, weeklySummary, insights, dailyChallenge, pendingShares] =
    await Promise.all([
      statsPromise,
      profile.active_template_id ? listTrainingDays(profile.active_template_id) : Promise.resolve([]),
      getWeeklySummary(profile.id),
      getInsights(profile.id),
      getDailyChallenge(
        profile.id,
        statsPromise.then((s) => s.pendingDayExerciseIds),
      ),
      listPendingShares(profile.id),
    ]);

  // Whatever the headline is showing — today's log, or else the suggested day.
  const headlineDayId = stats.todayLog ? stats.todayLog.dayId : stats.pendingDay?.id;
  const otherDays = trainingDays.filter((d) => d.id !== headlineDayId);
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
      <SharedRoutineCard shares={pendingShares} />
      <MotivationBanner summary={weeklySummary} />
      <div>
        <p className="text-muted-foreground">
          {greeting}, {firstName} 👋
        </p>
        <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.025em]">
          {today.charAt(0).toUpperCase() + today.slice(1)}
        </h1>
      </div>

      {/* The one entrance on this screen. Everything else is just there —
          scattering the same fade over every section made the whole page
          feel like it was still arriving each time you opened it.
          It also carries the only real frame on the page: a wider radius,
          a brighter edge and depth beneath it, so the thing you came here
          to do doesn't look like one more panel in a stack of identical
          panels. */}
      <Card className="fade-up glow-primary overflow-hidden rounded-3xl shadow-xl shadow-black/25 ring-primary/25">
        <CardContent className="pt-6">
          {stats.todayLog ? (
            // Something is already written down for today, so that stays the
            // headline — the sequence would otherwise have moved on to the
            // next day the moment the first set went in.
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
                  {stats.todayLog.name}
                </h2>
                <p className="mt-1 text-sm text-primary">
                  {stats.todayLog.setCount === 0
                    ? "Registro de hoy · aún sin series"
                    : `Registro de hoy · ${stats.todayLog.setCount} ${stats.todayLog.setCount === 1 ? "serie" : "series"}`}
                </p>
              </div>
              <Button
                render={<Link href={`/train/${stats.todayLog.id}`} />}
                size="lg"
                className="w-full"
              >
                <NotebookPen className="h-4 w-4" />
                Seguir registrando
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
                  <h2 className="text-2xl font-bold tracking-[-0.02em]">Día de descanso</h2>
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
                {/* No "HOY" eyebrow — the date sits right above this, so the
                    label was repeating what the reader already knows. The
                    day's name is the headline instead. */}
                <h2 className="truncate text-[2rem] font-bold leading-[1.1] tracking-[-0.02em]">
                  {stats.pendingDay.name}
                </h2>
                {stats.activeTemplateName && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stats.activeTemplateName}
                  </p>
                )}
              </div>

              {/* The work ahead, read as figures rather than as a sentence
                  strung together with middle dots. A training log is a
                  ledger, so the numbers get the mono face the rest of the
                  app already uses for weights and timers. */}
              <dl className="flex gap-7">
                <div>
                  <dd className="font-mono text-2xl font-semibold leading-none tabular-nums">
                    {stats.pendingDayExerciseCount}
                  </dd>
                  <dt className="mt-1.5 text-xs text-muted-foreground">ejercicios</dt>
                </div>
                <div>
                  <dd className="font-mono text-2xl font-semibold leading-none tabular-nums">
                    {stats.pendingDaySetCount}
                  </dd>
                  <dt className="mt-1.5 text-xs text-muted-foreground">series</dt>
                </div>
              </dl>
              {dailyChallenge && (
                <DailyChallengeCard
                  challenge={dailyChallenge}
                  exerciseHref={`/exercises/${dailyChallenge.exercise.slug}`}
                />
              )}
              <form action={openLogAction.bind(null, stats.pendingDay.id, true)}>
                <Button type="submit" size="lg" className="w-full">
                  <NotebookPen className="h-4 w-4" />
                  Registrar entreno
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>

      {profile.active_template_id && (
        <Link
          href="/train/new"
          className="-mt-5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <CalendarPlus className="h-4 w-4" />
          Registrar un día anterior
        </Link>
      )}

      {otherDays.length > 0 && (
        <div>
          {/* Sentence case, not a tracked-out all-caps eyebrow. It reads as
              a heading written for a person rather than as chrome. */}
          <h2 className="mb-2.5 text-sm font-semibold text-muted-foreground">
            Otros días de tu rutina
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {otherDays.map((day) => (
              <AlternateDayCard key={day.id} day={day} />
            ))}
          </div>
        </div>
      )}

      <WeeklySummaryCard summary={weeklySummary} />

      <InsightsCard insights={insights} />

      {stats.lastSession && (
        <Link
          href={`/train/history/${stats.lastSession.id}`}
          className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent/40"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{stats.lastSession.name}</p>
            <p className="text-muted-foreground">
              {new Date(stats.lastSession.completed_at!).toLocaleDateString("es-ES")} ·{" "}
              {stats.lastSession.total_volume_kg} kg
            </p>
          </div>
          <span className="stat-label shrink-0">Último</span>
        </Link>
      )}
    </div>
  );
}
