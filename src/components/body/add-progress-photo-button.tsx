"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { GuidedCameraCapture } from "./guided-camera-capture";
import { UploadProgressPhotoDialog } from "./upload-progress-photo-dialog";
import { uploadProgressPhotoAction } from "@/lib/actions/progress-photos";
import type { PhotoAngle } from "@/lib/photo-angles";
import { Button } from "@/components/ui/button";

// The guided camera is the primary path (this is what was actually asked
// for — capture straight from the app, aligned against a silhouette). The
// plain file dialog stays as a fallback next to it for when the camera is
// denied/unavailable, or the person just wants to pick an existing photo.
export function AddProgressPhotoButton() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleCapture(blob: Blob, angle: PhotoAngle) {
    setUploading(true);
    const file = new File([blob], `progress-${Date.now()}.jpg`, { type: "image/jpeg" });
    const formData = new FormData();
    formData.set("file", file);
    formData.set("angle", angle);
    formData.set("takenAt", new Date().toISOString().slice(0, 10));

    const result = await uploadProgressPhotoAction({ error: null }, formData);
    setUploading(false);
    setCameraOpen(false);

    if (result.error) toast.error(result.error);
    else toast.success("Foto guardada");
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button type="button" onClick={() => setCameraOpen(true)}>
          <Camera className="h-4 w-4" />
          Añadir foto
        </Button>
        <UploadProgressPhotoDialog triggerVariant="outline" triggerLabel="Subir archivo" />
      </div>

      {cameraOpen && (
        <GuidedCameraCapture
          initialAngle="front"
          onCapture={handleCapture}
          onCancel={() => setCameraOpen(false)}
        />
      )}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 text-white">
          Guardando foto...
        </div>
      )}
    </>
  );
}
