"use client";

import { Vibrate } from "lucide-react";
import { useRestTimerVibration } from "@/lib/hooks/use-rest-timer-vibration";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function TrainingSettings() {
  const { enabled, setEnabled } = useRestTimerVibration();

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
      <Vibrate className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Label htmlFor="rest-vibration" className="flex-1 text-sm font-medium">
        Vibrar al terminar el descanso
      </Label>
      <Switch id="rest-vibration" checked={enabled} onCheckedChange={setEnabled} />
    </div>
  );
}
