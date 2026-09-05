"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Plus } from "lucide-react";
import { uploadProgressPhotoAction } from "@/lib/actions/progress-photos";
import { PHOTO_ANGLES, PHOTO_ANGLE_LABELS, type PhotoAngle } from "@/lib/photo-angles";
import type { ActionResult } from "@/lib/actions/auth";
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

const initialState: ActionResult = { error: null };

export function UploadProgressPhotoDialog({
  defaultAngle = "front",
  triggerVariant = "default",
  triggerLabel = "Añadir foto",
}: {
  defaultAngle?: PhotoAngle;
  triggerVariant?: "default" | "outline";
  triggerLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(uploadProgressPhotoAction, initialState);
  const [angle, setAngle] = useState<PhotoAngle>(defaultAngle);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setPreview(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }}
    >
      <DialogTrigger render={<Button variant={triggerVariant} />}>
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Foto de progreso</DialogTitle>
          <DialogDescription>Guárdala solo tú puedes verla — es privada.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Ángulo</Label>
            <div className="flex gap-1.5">
              {PHOTO_ANGLES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAngle(a)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors duration-fast ${
                    angle === a
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {PHOTO_ANGLE_LABELS[a]}
                </button>
              ))}
            </div>
            <input type="hidden" name="angle" value={angle} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="takenAt">Fecha</Label>
            <Input
              id="takenAt"
              name="takenAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Foto</Label>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Vista previa"
                className="mx-auto h-48 w-auto rounded-xl border object-contain"
              />
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              >
                <Camera className="h-6 w-6" />
                <span className="text-sm">Toca para hacer o elegir una foto</span>
              </button>
            )}
            <input
              ref={fileInputRef}
              id="file"
              name="file"
              type="file"
              accept="image/*"
              capture="user"
              required
              onChange={handleFileChange}
              className={preview ? "block w-full text-sm" : "hidden"}
            />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Guardando..." : "Guardar foto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
