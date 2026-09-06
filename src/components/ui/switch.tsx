"use client";

import { cn } from "@/lib/utils";

// No Base UI switch primitive is pulled into this project yet, and this is
// the first on/off control the app needs — a plain styled checkbox keeps
// native semantics (keyboard, screen readers) without adding a dependency.
export function Switch({
  checked,
  onCheckedChange,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <label
      htmlFor={id}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full"
    >
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={cn(
          "absolute inset-0 rounded-full transition-colors duration-fast",
          checked ? "bg-primary" : "bg-muted",
        )}
      />
      <span
        className={cn(
          "relative h-5 w-5 rounded-full bg-white shadow transition-transform duration-fast",
          checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </label>
  );
}
