"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { muscleBadgeClass } from "@/lib/muscle-colors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

const movementTypeLabels: Record<string, string> = {
  compound: "Compuesto",
  isolation: "Aislado",
  cardio: "Cardio",
  mobility: "Movilidad",
};

export type ExerciseInfo = {
  slug: string;
  name: string;
  description: string | null;
  difficulty: string;
  movement_type: string;
  instructions: string[] | null;
  tips: string[] | null;
  common_mistakes: string[] | null;
  image_url?: string | null;
  muscle_groups: { name: string; slug?: string } | null;
  equipment: { name: string } | null;
};

export function ExerciseInfoDialog({ exercise }: { exercise: ExerciseInfo }) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" title="Información" />}>
        <Info className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{exercise.name}</DialogTitle>
          {exercise.description && <DialogDescription>{exercise.description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {exercise.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.image_url}
              alt={exercise.name}
              className="w-full rounded-md border object-cover"
            />
          )}
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscle_groups && (
              <Badge className={muscleBadgeClass(exercise.muscle_groups.slug)}>
                {exercise.muscle_groups.name}
              </Badge>
            )}
            {exercise.equipment && <Badge variant="outline">{exercise.equipment.name}</Badge>}
            <Badge variant="outline">{difficultyLabels[exercise.difficulty]}</Badge>
            <Badge variant="outline">{movementTypeLabels[exercise.movement_type]}</Badge>
          </div>

          {exercise.instructions && exercise.instructions.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Cómo hacerlo</p>
              <ol className="list-decimal space-y-1 pl-4">
                {exercise.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {exercise.tips && exercise.tips.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Consejos</p>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {exercise.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
            <div>
              <p className="mb-1 font-medium">Errores comunes</p>
              <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
                {exercise.common_mistakes.map((mistake, i) => (
                  <li key={i}>{mistake}</li>
                ))}
              </ul>
            </div>
          )}

          <Button render={<Link href={`/exercises/${exercise.slug}`} />} variant="outline" className="w-full">
            Ver mi progreso
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
