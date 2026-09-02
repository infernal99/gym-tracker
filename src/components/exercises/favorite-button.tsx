"use client";

import { Heart } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/exercises";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  exerciseId,
  isFavorite,
}: {
  exerciseId: string;
  isFavorite: boolean;
}) {
  return (
    <form action={toggleFavoriteAction.bind(null, exerciseId, isFavorite)}>
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        title={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
      >
        <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
      </Button>
    </form>
  );
}
