"use client";

import { useLayoutEffect, useRef } from "react";

// Animates rows sliding to their new position when a list re-sorts (e.g. a
// ranking after switching metric), instead of the DOM just snapping to the
// new order. This is FLIP without a library: each run measures where every
// row (identified by data-flip-key) landed, diffs it against where it was
// last run, and animates away the delta. The "First" position for a given
// row is simply the "Last" position this same hook recorded the previous
// time it ran, so no pre-update measurement pass is needed.
export function useFlipList(containerRef: React.RefObject<HTMLElement | null>, orderKey: string) {
  const positions = useRef<Map<string, number>>(new Map());
  const first = useRef(true);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rows = Array.from(container.querySelectorAll<HTMLElement>("[data-flip-key]"));
    const prev = positions.current;
    const next = new Map<string, number>();

    for (const row of rows) {
      const key = row.dataset.flipKey!;
      const top = row.getBoundingClientRect().top;
      next.set(key, top);

      if (!first.current && !reduceMotion) {
        const oldTop = prev.get(key);
        if (oldTop !== undefined && Math.abs(oldTop - top) > 1) {
          const delta = oldTop - top;
          row.style.transition = "none";
          row.style.transform = `translateY(${delta}px)`;
          // Force the browser to commit the jump before animating it away.
          row.getBoundingClientRect();
          row.style.transition = "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)";
          row.style.transform = "";
        }
      }
    }

    positions.current = next;
    first.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey]);
}
