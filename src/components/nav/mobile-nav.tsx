"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { resolveBottomNavLinks } from "@/components/nav/links";

const MORPH_MS = 420;

// Ball center, measured from the bar's own top edge — also where the
// active icon gets lifted to (see its translate below).
const BALL_TOP = 4;

// The notch is a small self-contained SVG shape (built once, in its own
// local coordinate space centered on x=0) that gets repositioned by
// translating the whole <svg>, the same way the ball itself is
// positioned — no per-frame path recomputation needed. Its curve starts
// and ends with a flat (zero-slope) tangent at y=0, so it blends into
// the bar's own straight top edge instead of meeting it at a corner —
// that flat-vs-circle corner was what read as the ball just "cutting"
// into the bar rather than the bar flowing around it.
const NOTCH_WIDTH = 76;
const NOTCH_CURVE_DEPTH = 22;
const NOTCH_TOTAL_DEPTH = 36;
const NOTCH_PATH = `M ${-NOTCH_WIDTH / 2} 0
  C ${-NOTCH_WIDTH / 2 + NOTCH_WIDTH * 0.2} 0 ${-NOTCH_WIDTH * 0.32} ${NOTCH_CURVE_DEPTH} 0 ${NOTCH_CURVE_DEPTH}
  C ${NOTCH_WIDTH * 0.32} ${NOTCH_CURVE_DEPTH} ${NOTCH_WIDTH / 2 - NOTCH_WIDTH * 0.2} 0 ${NOTCH_WIDTH / 2} 0
  L ${NOTCH_WIDTH / 2} ${NOTCH_TOTAL_DEPTH}
  L ${-NOTCH_WIDTH / 2} ${NOTCH_TOTAL_DEPTH}
  Z`;

export function MobileNav({ hrefs }: { hrefs: string[] }) {
  const pathname = usePathname();
  const links = resolveBottomNavLinks(hrefs);

  const activeIndex = links.findIndex(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
  const index = activeIndex === -1 ? 0 : activeIndex;

  // Briefly stretches the ball along its direction of travel so the slide
  // reads as a liquid blob squishing into place, not a token gliding on
  // rails — cleared once the move (see MORPH_MS, matches the CSS duration
  // below) finishes so it settles back to a plain circle.
  const [morphing, setMorphing] = useState(false);
  const prevIndex = useRef(index);

  useEffect(() => {
    if (prevIndex.current === index) return;
    prevIndex.current = index;
    setMorphing(true);
    const timeout = setTimeout(() => setMorphing(false), MORPH_MS);
    return () => clearTimeout(timeout);
  }, [index]);

  const leftPercent = (index + 0.5) * (100 / links.length);
  const ballPosition = {
    left: `${leftPercent}%`,
    top: `${BALL_TOP}px`,
    transform: "translate(-50%, -50%)",
  };

  return (
    <nav className="sticky bottom-0 z-50 shrink-0 px-3 pb-3 pt-1">
      <div className="relative">
        {/* The bar's own background+border. */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border bg-surface/95 shadow-lg shadow-black/30 backdrop-blur"
        />

        {/* Painted in the page's own background color — since nothing but
            that flat background ever sits directly behind the nav, this
            reads exactly like a real notch cut into the bar. */}
        <svg
          aria-hidden
          width={NOTCH_WIDTH}
          height={NOTCH_TOTAL_DEPTH}
          viewBox={`${-NOTCH_WIDTH / 2} 0 ${NOTCH_WIDTH} ${NOTCH_TOTAL_DEPTH}`}
          className="ease-liquid pointer-events-none absolute transition-[left] duration-[420ms]"
          style={{ left: `${leftPercent}%`, top: 0, transform: "translateX(-50%)" }}
        >
          <path d={NOTCH_PATH} fill="var(--background)" />
        </svg>

        {/* The ball itself, nested in the socket above. */}
        <div
          aria-hidden
          className={cn(
            "ease-liquid pointer-events-none absolute h-12 rounded-full transition-[left,width] duration-[420ms]",
            morphing ? "w-16" : "w-12",
          )}
          style={{
            ...ballPosition,
            background:
              "radial-gradient(circle at 32% 26%, color-mix(in oklch, white 35%, var(--primary)) 0%, var(--primary) 62%)",
            boxShadow:
              "0 14px 22px -6px rgba(0,0,0,0.55), 0 6px 14px -3px color-mix(in oklch, var(--primary) 65%, transparent)",
          }}
        />

        <div className="relative z-10 flex items-center py-2">
          {links.map((link, i) => {
            const active = i === index;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium"
              >
                <Icon
                  className={cn(
                    "ease-liquid h-5 w-5 transition-[color,transform] duration-[420ms]",
                    active
                      ? "-translate-y-[18px] text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                />
                <span
                  className={cn(
                    "transition-colors duration-300",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
