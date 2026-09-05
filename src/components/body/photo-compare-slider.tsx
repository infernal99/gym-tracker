"use client";

import { useRef, useState } from "react";
import type { ProgressPhoto } from "@/lib/services/progress-photos";

// A classic drag-to-reveal before/after. Both images render at full size,
// stacked; the top one ("after") is clipped with `clip-path` rather than
// resized, so it never squishes as the reveal amount changes — only a
// `width` on the wrapper (still full-size, still full-image) is animated,
// same effect, no library needed for something this small.
export function PhotoCompareSlider({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(before.takenAt)}</span>
        <span>{formatDate(after.takenAt)}</span>
      </div>
      <div
        ref={containerRef}
        className="relative aspect-[3/4] w-full touch-none overflow-hidden rounded-xl bg-muted select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updateFromClientX(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before.url}
          alt={`Antes (${before.takenAt})`}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={after.url}
          alt={`Después (${after.takenAt})`}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        />
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white" style={{ left: `${position}%` }}>
          <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md">
            <div className="flex gap-0.5">
              <div className="h-3 w-0.5 rounded-full bg-neutral-400" />
              <div className="h-3 w-0.5 rounded-full bg-neutral-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}
