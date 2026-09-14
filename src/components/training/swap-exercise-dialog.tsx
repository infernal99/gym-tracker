"use client";

import Link from "next/link";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type SwapOption = { id: string; name: string; done: boolean };

// Always-visible escape hatch for a busy gym: if whatever the routine has
// queued next is taken, jump to something else instead of just standing
// around waiting for it to free up. Only exercises not yet finished today
// are offered — re-suggesting one you already completed isn't a real
// alternative, and would just tempt a second, redundant round of it.
export function SwapExerciseDialog({
  sessionId,
  options,
}: {
  sessionId: string;
  options: SwapOption[];
}) {
  const pending = options.filter((o) => !o.done);

  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Shuffle className="h-3.5 w-3.5" />
        Cambiar ejercicio
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar ejercicio</DialogTitle>
          <DialogDescription>
            Si el que te toca está ocupado, haz otro mientras tanto — luego puedes volver a él.
          </DialogDescription>
        </DialogHeader>
        {pending.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">
            Ya has hecho el resto de ejercicios de hoy.
          </p>
        ) : (
          <div className="space-y-1.5">
            {pending.map((option) => (
              <Button
                key={option.id}
                render={<Link href={`/train/${sessionId}?exercise=${option.id}`} />}
                variant="outline"
                className="w-full justify-start"
              >
                {option.name}
              </Button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
