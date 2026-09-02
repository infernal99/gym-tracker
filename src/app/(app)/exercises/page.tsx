import Link from "next/link";
import { Dumbbell, Star } from "lucide-react";
import {
  listExercises,
  listMuscleGroups,
  listEquipment,
  listUsedExerciseIds,
  listFavoriteExerciseIds,
} from "@/lib/services/exercises";
import { requireProfile } from "@/lib/services/profile";
import { ExerciseInfoDialog } from "@/components/exercises/exercise-info-dialog";
import { FavoriteButton } from "@/components/exercises/favorite-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    muscle?: string;
    equipment?: string;
    difficulty?: string;
    type?: string;
    favorites?: string;
  }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const onlyFavorites = params.favorites === "1";

  const [exercises, muscleGroups, equipment, usedExerciseIds, favoriteIds] = await Promise.all([
    listExercises({
      search: params.search,
      muscleGroupId: params.muscle === "all" ? undefined : params.muscle,
      equipmentId: params.equipment === "all" ? undefined : params.equipment,
      difficulty:
        params.difficulty && params.difficulty !== "all"
          ? (params.difficulty as "beginner" | "intermediate" | "advanced")
          : undefined,
      movementType:
        params.type && params.type !== "all"
          ? (params.type as "compound" | "isolation" | "cardio" | "mobility")
          : undefined,
    }),
    listMuscleGroups(),
    listEquipment(),
    profile.active_template_id
      ? listUsedExerciseIds(profile.active_template_id)
      : Promise.resolve(new Set<string>()),
    listFavoriteExerciseIds(profile.id),
  ]);

  const visibleExercises = onlyFavorites
    ? exercises.filter((ex) => favoriteIds.has(ex.id))
    : exercises;
  const myExercises = visibleExercises.filter((ex) => usedExerciseIds.has(ex.id));
  const otherExercises = visibleExercises.filter((ex) => !usedExerciseIds.has(ex.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>
        <Link
          href={onlyFavorites ? "/exercises" : "/exercises?favorites=1"}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium ${
            onlyFavorites ? "bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          <Star className="h-4 w-4" />
          Favoritos
        </Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" method="get">
        <Input
          name="search"
          placeholder="Buscar ejercicio..."
          defaultValue={params.search}
          className="sm:max-w-xs"
        />
        <Select name="muscle" defaultValue={params.muscle ?? "all"}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Músculo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los músculos</SelectItem>
            {muscleGroups.map((mg) => (
              <SelectItem key={mg.id} value={mg.id}>
                {mg.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="equipment" defaultValue={params.equipment ?? "all"}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Equipamiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el equipamiento</SelectItem>
            {equipment.map((eq) => (
              <SelectItem key={eq.id} value={eq.id}>
                {eq.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="difficulty" defaultValue={params.difficulty ?? "all"}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Dificultad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toda dificultad</SelectItem>
            {Object.entries(difficultyLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select name="type" defaultValue={params.type ?? "all"}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo tipo</SelectItem>
            {Object.entries(movementTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onlyFavorites && <input type="hidden" name="favorites" value="1" />}
        <Button type="submit">Filtrar</Button>
      </form>

      {visibleExercises.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {onlyFavorites
                ? "Todavía no has marcado ningún ejercicio como favorito."
                : "No se encontraron ejercicios."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {myExercises.length > 0 && (
            <div className="space-y-3">
              <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Star className="h-4 w-4" />
                En tu rutina
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {myExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={favoriteIds.has(exercise.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {otherExercises.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {myExercises.length > 0 ? "Otros ejercicios" : "Todos los ejercicios"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {otherExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={favoriteIds.has(exercise.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseCard({
  exercise,
  isFavorite,
}: {
  exercise: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    difficulty: string;
    movement_type: string;
    instructions: string[] | null;
    tips: string[] | null;
    common_mistakes: string[] | null;
    thumbnail_url?: string | null;
    muscle_groups: { name: string } | null;
    equipment: { name: string } | null;
  };
  isFavorite: boolean;
}) {
  return (
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="space-y-2 pt-6">
        <Link href={`/exercises/${exercise.slug}`} className="flex items-start gap-3">
          {exercise.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.thumbnail_url}
              alt={exercise.name}
              className="h-12 w-12 shrink-0 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
              <Dumbbell className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium hover:underline">{exercise.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary">{exercise.muscle_groups?.name}</Badge>
              {exercise.equipment?.name && (
                <Badge variant="outline">{exercise.equipment.name}</Badge>
              )}
              <Badge variant="outline">{difficultyLabels[exercise.difficulty]}</Badge>
            </div>
            {exercise.description && (
              <p className="mt-2 text-sm text-muted-foreground">{exercise.description}</p>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1 pt-1">
          <ExerciseInfoDialog exercise={exercise} />
          <FavoriteButton exerciseId={exercise.id} isFavorite={isFavorite} />
        </div>
      </CardContent>
    </Card>
  );
}
