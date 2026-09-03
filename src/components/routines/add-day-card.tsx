import { Plus } from "lucide-react";
import { addDayAction } from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MuscleGroupOption = { id: string; name: string };

export function AddDayCard({
  templateId,
  muscleGroups,
}: {
  templateId: string;
  muscleGroups: MuscleGroupOption[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Añadir día</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={addDayAction.bind(null, templateId)} className="flex flex-col gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="dayName" className="text-xs">
              Nombre
            </Label>
            <Input id="dayName" name="name" placeholder="Push" required />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">¿Qué músculos entrenas este día?</Label>
            <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border p-3">
              {muscleGroups.map((group) => (
                <label key={group.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="muscleGroupIds" value={group.id} className="h-4 w-4" />
                  {group.name}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="isRestDay" className="h-4 w-4" />
            Día de descanso
          </label>
          <Button type="submit">
            <Plus className="h-4 w-4" />
            Añadir día
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
