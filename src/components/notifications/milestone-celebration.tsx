"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { markNotificationReadAction } from "@/lib/actions/notifications";
import type { MilestoneNotification } from "@/lib/services/notifications";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function MilestoneCelebration({
  milestones,
}: {
  milestones: MilestoneNotification[];
}) {
  const [queue, setQueue] = useState(milestones);
  const current = queue[0];

  if (!current) return null;

  function dismiss() {
    markNotificationReadAction(current.id);
    setQueue((q) => q.slice(1));
  }

  return (
    <Dialog open onOpenChange={(open) => !open && dismiss()}>
      <DialogContent showCloseButton={false} className="glow-primary overflow-hidden text-center">
        <div className="flex flex-col items-center gap-3 py-4 fade-up duration-emphasis">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <TrendingUp className="h-8 w-8" />
          </div>
          <p className="stat-label text-success">Nuevo hito</p>
          <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
          {current.body && <p className="text-sm text-muted-foreground">{current.body}</p>}
          <div className="mt-2 flex w-full gap-2">
            {current.exerciseSlug && (
              <Button
                variant="outline"
                className="flex-1"
                render={<a href={`/exercises/${current.exerciseSlug}`} />}
                onClick={dismiss}
              >
                Ver ejercicio
              </Button>
            )}
            <Button className="flex-1" onClick={dismiss}>
              Genial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
