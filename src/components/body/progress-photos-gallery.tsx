"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProgressPhotoAction } from "@/lib/actions/progress-photos";
import { PHOTO_ANGLES, PHOTO_ANGLE_LABELS } from "@/lib/photo-angles";
import type { ProgressPhoto } from "@/lib/services/progress-photos";
import { PhotoCompareSlider } from "./photo-compare-slider";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AngleSection({ angle, photos }: { angle: string; photos: ProgressPhoto[] }) {
  // Oldest vs. newest by default — the comparison someone actually opens
  // this for — but either side can be repointed at any photo of this angle.
  const sorted = [...photos].sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  const [beforeId, setBeforeId] = useState(sorted[0]?.id);
  const [afterId, setAfterId] = useState(sorted[sorted.length - 1]?.id);

  const before = photos.find((p) => p.id === beforeId) ?? sorted[0];
  const after = photos.find((p) => p.id === afterId) ?? sorted[sorted.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{PHOTO_ANGLE_LABELS[angle as keyof typeof PHOTO_ANGLE_LABELS]}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {photos.length >= 2 && before && after ? (
          <>
            <PhotoCompareSlider before={before} after={after} />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="stat-label">Antes</label>
                <select
                  value={beforeId}
                  onChange={(e) => setBeforeId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm"
                >
                  {sorted.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.takenAt)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="stat-label">Después</label>
                <select
                  value={afterId}
                  onChange={(e) => setAfterId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-2 py-1.5 text-sm"
                >
                  {sorted.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatDate(p.takenAt)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {photos.length === 0
              ? "Todavía no tienes fotos con este ángulo."
              : "Añade una segunda foto de este ángulo para poder compararlas."}
          </p>
        )}

        <div className="grid grid-cols-4 gap-1.5">
          {sorted.map((photo) => (
            <div key={photo.id} className="group relative aspect-[3/4] overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={formatDate(photo.takenAt)} className="h-full w-full object-cover" />
              <form
                action={deleteProgressPhotoAction.bind(null, photo.id, photo.storagePath)}
                className="absolute top-0.5 right-0.5"
              >
                <ConfirmSubmitButton
                  confirmMessage="¿Eliminar esta foto? No se puede deshacer."
                  variant="ghost"
                  size="icon-xs"
                  className="bg-black/50 text-white hover:bg-black/70 hover:text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </ConfirmSubmitButton>
              </form>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressPhotosGallery({ photos }: { photos: ProgressPhoto[] }) {
  const byAngle = useMemo(() => {
    const map = new Map<string, ProgressPhoto[]>();
    for (const angle of PHOTO_ANGLES) map.set(angle, []);
    for (const photo of photos) map.get(photo.angle)?.push(photo);
    return map;
  }, [photos]);

  return (
    <div className="space-y-4">
      {PHOTO_ANGLES.map((angle) => (
        <AngleSection key={angle} angle={angle} photos={byAngle.get(angle) ?? []} />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
