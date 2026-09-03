import { Plus } from "lucide-react";
import { addDayAction } from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AddDayCard({ templateId }: { templateId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Añadir día</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={addDayAction.bind(null, templateId)} className="flex flex-col gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="dayName" className="text-xs">
              Nombre
            </Label>
            <Input id="dayName" name="name" placeholder="Push" required />
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
