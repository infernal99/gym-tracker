import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { requireProfile } from "@/lib/services/profile";
import { listTrainingDays } from "@/lib/services/training";
import { openLogAction } from "@/lib/actions/training";
import { todayKey } from "@/lib/date-utils";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// For writing down a day after the fact — the session you forgot to log,
// or last week's from a notebook. Picks a date and one of the routine's
// days; if that day already has a log on that date, it just opens it.
export default async function NewLogPage() {
  const profile = await requireProfile();
  const days = profile.active_template_id
    ? await listTrainingDays(profile.active_template_id)
    : [];
  const today = todayKey();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BackButton fallbackHref="/train/history" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Registrar un día</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Elige la fecha y qué día de tu rutina hiciste.
        </p>
      </div>

      {days.length === 0 ? (
        <div className="flex flex-col items-start gap-3">
          <p className="text-muted-foreground">Tu rutina activa todavía no tiene días.</p>
          <Button render={<Link href="/my-routine" />}>Ver mi rutina</Button>
        </div>
      ) : (
        <form action={openLogAction.bind(null, null, true)} className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="date" className="stat-label">
              Fecha
            </label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              max={today}
              defaultValue={today}
              className="h-12 rounded-xl text-base"
            />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="stat-label mb-1.5">Día de la rutina</legend>
            <div className="grid grid-cols-2 gap-2">
              {days.map((day, i) => (
                <label key={day.id} className="cursor-pointer">
                  <input
                    type="radio"
                    name="dayId"
                    value={day.id}
                    defaultChecked={i === 0}
                    className="peer sr-only"
                  />
                  <span className="flex h-12 items-center rounded-xl border bg-card px-3 text-sm font-medium transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
                    <span className="truncate">{day.name}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="lg" className="w-full">
            <NotebookPen className="h-4 w-4" />
            Abrir registro
          </Button>
        </form>
      )}
    </div>
  );
}
