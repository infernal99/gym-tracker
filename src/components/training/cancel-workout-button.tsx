"use client";

import { cancelWorkoutAction } from "@/lib/actions/training";
import { useRestTimer } from "@/components/training/rest-timer-provider";
import { Button } from "@/components/ui/button";

export function CancelWorkoutButton({ sessionId }: { sessionId: string }) {
  const { clear } = useRestTimer();
  return (
    <form
      action={cancelWorkoutAction.bind(null, sessionId)}
      onSubmit={(e) => {
        if (!confirm("¿Cancelar este entrenamiento? Se perderán las series registradas.")) {
          e.preventDefault();
          return;
        }
        clear(sessionId);
      }}
    >
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Cancelar
      </Button>
    </form>
  );
}
