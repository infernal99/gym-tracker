"use client";

import { Plus, Users } from "lucide-react";
import { createGroupAction } from "@/lib/actions/groups";
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

export function CreateGroupDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Crear grupo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Nuevo grupo
          </DialogTitle>
          <DialogDescription>
            Un espacio privado para entrenar con amigos. Solo tú podrás invitar a quien quieras
            después.
          </DialogDescription>
        </DialogHeader>
        <form action={createGroupAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nombre</Label>
            <Input id="group-name" name="name" placeholder="Gym Boys" maxLength={60} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description">Descripción (opcional)</Label>
            <Textarea
              id="group-description"
              name="description"
              placeholder="¿De qué va este grupo?"
              maxLength={300}
              rows={2}
            />
          </div>
          <Button type="submit" className="w-full">
            Crear grupo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
