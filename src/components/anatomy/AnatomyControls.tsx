"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AnatomyView = "front" | "back" | "side" | "free";

const VIEWS: { id: AnatomyView; label: string }[] = [
  { id: "front", label: "Frontal" },
  { id: "back", label: "Trasera" },
  { id: "side", label: "Lateral" },
];

export function AnatomyControls({
  view,
  onChange,
}: {
  view: AnatomyView;
  onChange: (view: AnatomyView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {VIEWS.map((v) => (
        <Button
          key={v.id}
          type="button"
          size="sm"
          variant={view === v.id ? "default" : "outline"}
          onClick={() => onChange(v.id)}
        >
          {v.label}
        </Button>
      ))}
      <Button
        type="button"
        size="sm"
        variant={view === "free" ? "default" : "outline"}
        onClick={() => onChange("free")}
        title="Rotación libre"
      >
        <RotateCw className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
