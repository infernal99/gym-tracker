import { Dumbbell, Star } from "lucide-react";
import {
  listExercises,
  listMuscleGroups,
  listEquipment,
  listUsedExerciseIds,
} from "@/lib/services/exercises";
import { requireProfile } from "@/lib/services/profile";
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

export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; muscle?: string; equipment?: string }>;
}) {
  const params = await searchParams;
  const profile = await requireProfile();
  const [exercises, muscleGroups, equipment, usedExerciseIds] = await Promise.all([
    listExercises({
      search: params.search,
      muscleGroupId: params.muscle === "all" ? undefined : params.muscle,
      equipmentId: params.equipment === "all" ? undefined : params.equipment,
    }),
    listMuscleGroups(),
    listEquipment(),
    profile.active_template_id
      ? listUsedExerciseIds(profile.active_template_id)
      : Promise.resolve(new Set<string>()),
  ]);

  const myExercises = exercises.filter((ex) => usedExerciseIds.has(ex.id));
  const otherExercises = exercises.filter((ex) => !usedExerciseIds.has(ex.id));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ejercicios</h1>

      <form className="flex flex-col gap-2 sm:flex-row" method="get">
        <Input
          name="search"
          placeholder="Buscar ejercicio..."
          defaultValue={params.search}
          className="sm:max-w-xs"
        />
        <Select name="muscle" defaultValue={params.muscle ?? "all"}>
          <SelectTrigger className="w-full sm:w-44">
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
          <SelectTrigger className="w-full sm:w-44">
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
        <Button type="submit">Filtrar</Button>
      </form>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No se encontraron ejercicios.</p>
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
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {myExercises.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
                ))}
              </div>
            </div>
          )}

          {otherExercises.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {myExercises.length > 0 ? "Otros ejercicios" : "Todos los ejercicios"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {otherExercises.map((exercise) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} />
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
}: {
  exercise: {
    id: string;
    name: string;
    description: string | null;
    difficulty: string;
    muscle_groups: { name: string } | null;
    equipment: { name: string } | null;
  };
}) {
  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <p className="font-medium">{exercise.name}</p>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{exercise.muscle_groups?.name}</Badge>
          {exercise.equipment?.name && <Badge variant="outline">{exercise.equipment.name}</Badge>}
          <Badge variant="outline">{difficultyLabels[exercise.difficulty]}</Badge>
        </div>
        {exercise.description && (
          <p className="text-sm text-muted-foreground">{exercise.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
