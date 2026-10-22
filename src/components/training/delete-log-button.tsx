"use client";

import { Trash2 } from "lucide-react";
import { deleteLogAction } from "@/lib/actions/training";
import { Button } from "@/components/ui/button";

export function DeleteLogButton({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={deleteLogAction.bind(null, sessionId)}
      onSubmit={(e) => {
        if (!confirm("¿Borrar este registro? Se eliminarán todas sus series.")) {
          e.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="ghost" size="icon-sm" aria-label="Borrar registro">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}
