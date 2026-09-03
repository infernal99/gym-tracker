"use client";

import { Pencil } from "lucide-react";
import { renameTemplateAction } from "@/lib/actions/routines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function RenameTemplateDialog({
  templateId,
  name,
  description,
}: {
  templateId: string;
  name: string;
  description: string | null;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar rutina</DialogTitle>
          <DialogDescription>Cambia el nombre o la descripción de tu rutina.</DialogDescription>
        </DialogHeader>
        <form action={renameTemplateAction.bind(null, templateId)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" defaultValue={name} required maxLength={60} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              maxLength={280}
              defaultValue={description ?? ""}
            />
          </div>
          <Button type="submit" className="w-full">
            Guardar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
