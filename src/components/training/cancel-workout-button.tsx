"use client";

import { cancelWorkoutAction } from "@/lib/actions/training";
import { Button } from "@/components/ui/button";

export function CancelWorkoutButton({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={cancelWorkoutAction.bind(null, sessionId)}
      onSubmit={(e) => {
        if (!confirm("¿Cancelar este entrenamiento? Se perderán las series registradas.")) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
        Cancelar
      </Button>
    </form>
  );
}
