"use client";

import { Settings2 } from "lucide-react";
import { updateSharingSettingsAction } from "@/lib/actions/groups";
import type { GroupMemberStats } from "@/lib/services/groups";
import { Button } from "@/components/ui/button";

// Self-only: what the current member shares with the rest of this specific
// group. Each toggle is independent EXCEPT streak, which can't be shown
// without the underlying workout data — see the note on the checkbox.
export function SharingSettingsForm({
  groupId,
  sharing,
}: {
  groupId: string;
  sharing: GroupMemberStats["sharing"];
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        Qué comparto en este grupo
      </p>
      <form action={updateSharingSettingsAction.bind(null, groupId)} className="space-y-2.5">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="shareWorkouts"
            defaultChecked={sharing.workouts}
            className="h-4 w-4"
          />
          Mis entrenamientos y volumen
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="sharePrs" defaultChecked={sharing.prs} className="h-4 w-4" />
          Mis PRs
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="shareStreak"
            defaultChecked={sharing.streak}
            className="h-4 w-4"
          />
          Mi racha
        </label>
        <p className="text-xs text-muted-foreground">
          La racha solo puede verse si también compartes tus entrenamientos.
        </p>
        <Button type="submit" size="sm" variant="outline" className="w-full">
          Guardar
        </Button>
      </form>
    </div>
  );
}
