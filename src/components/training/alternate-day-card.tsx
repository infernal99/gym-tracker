"use client";

import { ArrowRight } from "lucide-react";
import { startWorkoutAction } from "@/lib/actions/training";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AlternateDayCard({ day }: { day: { id: string; name: string } }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button className="rounded-md border px-3 py-2 text-left text-sm hover:bg-accent" />
        }
      >
        <p className="font-medium">{day.name}</p>
        <p className="text-xs text-muted-foreground">Entrenar en su lugar</p>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Entrenar &quot;{day.name}&quot;</DialogTitle>
          <DialogDescription>
            No es el entrenamiento sugerido para hoy. ¿Quieres que tu próxima sugerencia siga la
            secuencia a partir de este día, o prefieres entrenarlo solo hoy sin cambiar el orden?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <form action={startWorkoutAction.bind(null, day.id, true)}>
            <Button type="submit" className="w-full">
              <ArrowRight className="h-4 w-4" />
              Continuar la secuencia desde aquí
            </Button>
          </form>
          <form action={startWorkoutAction.bind(null, day.id, false)}>
            <Button type="submit" variant="outline" className="w-full">
              Solo entrenar hoy
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
