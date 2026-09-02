"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

const difficultyOptions = [
  { value: "beginner", label: "Principiante" },
  { value: "intermediate", label: "Intermedio" },
  { value: "advanced", label: "Avanzado" },
];
const typeOptions = [
  { value: "compound", label: "Compuesto" },
  { value: "isolation", label: "Aislado" },
  { value: "cardio", label: "Cardio" },
  { value: "mobility", label: "Movilidad" },
];

function PillGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? "all" : opt.value)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-transparent text-foreground hover:bg-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ExerciseFiltersSheet({
  equipment,
}: {
  equipment: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [equipmentId, setEquipmentId] = useState(searchParams.get("equipment") ?? "all");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") ?? "all");
  const [type, setType] = useState(searchParams.get("type") ?? "all");
  const [open, setOpen] = useState(false);

  const activeCount = [
    searchParams.get("equipment"),
    searchParams.get("difficulty"),
    searchParams.get("type"),
  ].filter(Boolean).length;

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of [
      ["equipment", equipmentId],
      ["difficulty", difficulty],
      ["type", type],
    ] as const) {
      if (value === "all") params.delete(key);
      else params.set(key, value);
    }
    router.push(`/exercises?${params.toString()}`);
    setOpen(false);
  }

  function reset() {
    setEquipmentId("all");
    setDifficulty("all");
    setType("all");
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon" className="relative shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader className="flex-row items-center justify-between">
          <SheetTitle>Filtros</SheetTitle>
          <Button variant="ghost" size="sm" onClick={reset}>
            Restablecer
          </Button>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-2">
          {equipment.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Equipamiento</p>
              <PillGroup
                options={equipment.map((e) => ({ value: e.id, label: e.name }))}
                value={equipmentId}
                onChange={setEquipmentId}
              />
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Dificultad</p>
            <PillGroup options={difficultyOptions} value={difficulty} onChange={setDifficulty} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Tipo</p>
            <PillGroup options={typeOptions} value={type} onChange={setType} />
          </div>
        </div>
        <SheetFooter>
          <Button onClick={apply}>Aplicar filtros</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
