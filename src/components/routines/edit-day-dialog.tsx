"use client";

import { Pencil } from "lucide-react";
import { updateDayAction } from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type MuscleGroupOption = { id: string; name: string };

export function EditDayDialog({
  day,
  templateId,
  muscleGroups,
  trigger,
}: {
  day: { id: string; name: string; is_rest_day: boolean; muscle_group_ids: string[] };
  templateId: string;
  muscleGroups: MuscleGroupOption[];
  trigger?: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={trigger ? <Button variant="outline" size="sm" className="w-full" /> : <Button variant="ghost" size="icon-sm" />}
      >
        {trigger ?? <Pencil className="h-3.5 w-3.5" />}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar día</DialogTitle>
          <DialogDescription>Cambia el nombre o los músculos de este día.</DialogDescription>
        </DialogHeader>
        <form action={updateDayAction.bind(null, day.id, templateId)} className="space-y-4">
          <input type="hidden" name="isRestDay" value={day.is_rest_day ? "on" : ""} />
          <div className="space-y-2">
            <Label htmlFor="dayEditName">Nombre</Label>
            <Input id="dayEditName" name="name" defaultValue={day.name} required maxLength={40} />
          </div>
          {!day.is_rest_day && (
            <div className="space-y-2">
              <Label className="text-xs">¿Qué músculos entrenas este día?</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border p-3">
                {muscleGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      name="muscleGroupIds"
                      value={group.id}
                      defaultChecked={day.muscle_group_ids.includes(group.id)}
                      className="h-4 w-4"
                    />
                    {group.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <Button type="submit" className="w-full">
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
