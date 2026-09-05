import { requireProfile } from "@/lib/services/profile";
import { listProgressPhotos } from "@/lib/services/progress-photos";
import { ProgressPhotosGallery } from "@/components/body/progress-photos-gallery";
import { UploadProgressPhotoDialog } from "@/components/body/upload-progress-photo-dialog";
import { BackButton } from "@/components/ui/back-button";

export default async function ProgressPhotosPage() {
  const profile = await requireProfile();
  const photos = await listProgressPhotos(profile.id);

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/body" />
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fotos de progreso</h1>
          <p className="text-sm text-muted-foreground">Privadas — solo tú puedes verlas.</p>
        </div>
        <UploadProgressPhotoDialog />
      </div>

      <div className="fade-up [animation-delay:60ms]">
        <ProgressPhotosGallery photos={photos} />
      </div>
    </div>
  );
}
