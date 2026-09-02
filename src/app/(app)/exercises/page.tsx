import Link from "next/link";
import { Dumbbell, Search, Star } from "lucide-react";
import {
  listExercises,
  listMuscleGroups,
  listEquipment,
  listUsedExerciseIds,
  listFavoriteExerciseIds,
} from "@/lib/services/exercises";
import { requireProfile } from "@/lib/services/profile";
import { muscleDotClass } from "@/lib/muscle-colors";
import { ExerciseInfoDialog } from "@/components/exercises/exercise-info-dialog";
import { FavoriteButton } from "@/components/exercises/favorite-button";
import { ExerciseFiltersSheet } from "@/components/exercises/exercise-filters-sheet";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

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
  const activeMuscle = params.muscle && params.muscle !== "all" ? params.muscle : undefined;

  const [exercises, muscleGroups, equipment, usedExerciseIds, favoriteIds] = await Promise.all([
    listExercises({
      search: params.search,
      muscleGroupId: activeMuscle,
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

  // Preserve every filter except "muscle" when building the pill links, and
  // "favorites" always stays off the muscle pills (it has its own toggle).
  const muscleLinkParams = new URLSearchParams();
  if (params.search) muscleLinkParams.set("search", params.search);
  if (params.equipment && params.equipment !== "all") muscleLinkParams.set("equipment", params.equipment);
  if (params.difficulty && params.difficulty !== "all") muscleLinkParams.set("difficulty", params.difficulty);
  if (params.type && params.type !== "all") muscleLinkParams.set("type", params.type);
  if (onlyFavorites) muscleLinkParams.set("favorites", "1");

  function muscleHref(muscleId?: string) {
    const p = new URLSearchParams(muscleLinkParams);
    if (muscleId) p.set("muscle", muscleId);
    const qs = p.toString();
    return qs ? `/exercises?${qs}` : "/exercises";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>
        <Link
          href={onlyFavorites ? "/exercises" : "/exercises?favorites=1"}
          className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors ${
            onlyFavorites
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-accent"
          }`}
        >
          <Star className={`h-4 w-4 ${onlyFavorites ? "fill-current" : ""}`} />
          Favoritos
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <form className="relative flex-1" method="get">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Buscar ejercicio..."
            defaultValue={params.search}
            className="pl-9"
          />
          {activeMuscle && <input type="hidden" name="muscle" value={activeMuscle} />}
          {params.equipment && params.equipment !== "all" && (
            <input type="hidden" name="equipment" value={params.equipment} />
          )}
          {params.difficulty && params.difficulty !== "all" && (
            <input type="hidden" name="difficulty" value={params.difficulty} />
          )}
          {params.type && params.type !== "all" && (
            <input type="hidden" name="type" value={params.type} />
          )}
          {onlyFavorites && <input type="hidden" name="favorites" value="1" />}
        </form>
        <ExerciseFiltersSheet equipment={equipment} />
      </div>

      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <Link
          href={muscleHref()}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !activeMuscle
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          Todos
        </Link>
        {muscleGroups.map((mg) => (
          <Link
            key={mg.id}
            href={muscleHref(mg.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeMuscle === mg.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {mg.name}
          </Link>
        ))}
      </div>

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
        <div className="space-y-6">
          {myExercises.length > 0 && (
            <div className="space-y-1">
              <h2 className="flex items-center gap-1.5 px-1 text-sm font-medium text-muted-foreground">
                <Star className="h-3.5 w-3.5" />
                En tu rutina
              </h2>
              <ExerciseList exercises={myExercises} favoriteIds={favoriteIds} />
            </div>
          )}

          {otherExercises.length > 0 && (
            <div className="space-y-1">
              <h2 className="px-1 text-sm font-medium text-muted-foreground">
                {myExercises.length > 0 ? "Otros ejercicios" : "Todos los ejercicios"}
              </h2>
              <ExerciseList exercises={otherExercises} favoriteIds={favoriteIds} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ExerciseListItem = {
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
  muscle_groups: { name: string; slug: string } | null;
  equipment: { name: string } | null;
};

function ExerciseList({
  exercises,
  favoriteIds,
}: {
  exercises: ExerciseListItem[];
  favoriteIds: Set<string>;
}) {
  return (
    <Card className="divide-y divide-border overflow-hidden py-0">
      {exercises.map((exercise) => (
        <ExerciseRow
          key={exercise.id}
          exercise={exercise}
          isFavorite={favoriteIds.has(exercise.id)}
        />
      ))}
    </Card>
  );
}

function ExerciseRow({
  exercise,
  isFavorite,
}: {
  exercise: ExerciseListItem;
  isFavorite: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Link href={`/exercises/${exercise.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        {exercise.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={exercise.thumbnail_url}
            alt={exercise.name}
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Dumbbell className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{exercise.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            {exercise.muscle_groups && (
              <span
                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${muscleDotClass(exercise.muscle_groups.slug)}`}
              />
            )}
            {exercise.muscle_groups?.name}
            {exercise.equipment?.name ? ` · ${exercise.equipment.name}` : ""}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-0.5">
        <ExerciseInfoDialog exercise={exercise} />
        <FavoriteButton exerciseId={exercise.id} isFavorite={isFavorite} />
      </div>
    </div>
  );
}
