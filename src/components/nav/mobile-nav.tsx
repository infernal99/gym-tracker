"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { resolveBottomNavLinks } from "@/components/nav/links";

const MORPH_MS = 420;

// The ball rides with its center on the bar's top edge: half of it above
// the bar, half nested into the cradle cut below. That's also the point
// the active icon gets lifted to (see its translate below).
const BALL_TOP = 0;
const BALL_RADIUS = 24;

// The cradle: a circle 6px wider than the ball all around, so the cut
// hugs the ball's contour instead of scooping a wide bite out of the
// bar. Where that circle would meet the bar's straight top edge it would
// leave a hard corner (the circle runs vertical there) — which is what
// read as the ball merely clipping the bar — so each side gets a fillet
// arc, tangent to both the flat edge and the cradle, easing the edge
// down into the cut. The tangent points below are just the standard
// two-tangent-circles construction, kept as math so the shape stays
// exact if the radii are retuned.
const CRADLE_R = BALL_RADIUS + 6;
const FILLET_R = 12;
const FILLET_X = Math.sqrt(CRADLE_R * CRADLE_R + 2 * CRADLE_R * FILLET_R);
const TANGENT_X = (CRADLE_R * FILLET_X) / (CRADLE_R + FILLET_R);
const TANGENT_Y = (CRADLE_R * FILLET_R) / (CRADLE_R + FILLET_R);
const NOTCH_OUTLINE = `M ${-FILLET_X} 0
  A ${FILLET_R} ${FILLET_R} 0 0 1 ${-TANGENT_X} ${TANGENT_Y}
  A ${CRADLE_R} ${CRADLE_R} 0 0 0 ${TANGENT_X} ${TANGENT_Y}
  A ${FILLET_R} ${FILLET_R} 0 0 1 ${FILLET_X} 0`;
// Closing the outline back along the top edge gives the filled cut.
const NOTCH_PATH = `${NOTCH_OUTLINE} Z`;

export function MobileNav({ hrefs }: { hrefs: string[] }) {
  const pathname = usePathname();
  const links = resolveBottomNavLinks(hrefs);

  const activeIndex = links.findIndex(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
  // Plenty of pages (Mi rutina, Historial, Amigos…) live outside these five
  // tabs. Falling back to tab 0 there would claim you're on Hoy when you
  // aren't, so the ball is hidden instead — nothing is selected, because
  // nothing is. It keeps the last real tab's position while hidden so it
  // fades out in place rather than sliding away first.
  const isOnTab = activeIndex !== -1;
  const [lastTabIndex, setLastTabIndex] = useState(isOnTab ? activeIndex : 0);
  const index = isOnTab ? activeIndex : lastTabIndex;

  useEffect(() => {
    if (isOnTab) setLastTabIndex(activeIndex);
  }, [isOnTab, activeIndex]);

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

        {/* Clipped to the bar's own silhouette: on the first and last tab
            the cradle reaches past the bar's rounded end, and without this
            it would paint that corner away and leave the outline hanging
            in mid-air outside the bar. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          {/* Painted in the page's own background color — since nothing but
              that flat background ever sits directly behind the nav, this
              reads exactly like a real notch cut into the bar. */}
          <svg
            // +2 of height so the outline stroke at the cradle's deepest
            // point isn't clipped by the viewBox edge.
            width={FILLET_X * 2}
            height={CRADLE_R + 2}
            viewBox={`${-FILLET_X} 0 ${FILLET_X * 2} ${CRADLE_R + 2}`}
            className="ease-liquid absolute transition-[left,opacity] duration-[420ms]"
            style={{
              left: `${leftPercent}%`,
              top: 0,
              transform: "translateX(-50%)",
              opacity: isOnTab ? 1 : 0,
            }}
          >
            <path d={NOTCH_PATH} fill="var(--background)" />
            {/* Carries the bar's own border around the cut, so its outline
                reads as one continuous edge flowing around the ball. */}
            <path d={NOTCH_OUTLINE} fill="none" stroke="var(--border)" strokeWidth={1} />
          </svg>
        </div>

        {/* The ball itself, nested in the socket above. */}
        <div
          aria-hidden
          className={cn(
            "ease-liquid pointer-events-none absolute h-12 rounded-full transition-[left,width,opacity,scale] duration-[420ms]",
            // Kept under the cradle's own width so the stretch never
            // spills past the cut and back onto the bar's surface.
            morphing ? "w-14" : "w-12",
          )}
          style={{
            ...ballPosition,
            opacity: isOnTab ? 1 : 0,
            // Shrinks as it goes rather than vanishing flat — but never to
            // 0, which reads as a glitch rather than a retreat.
            scale: isOnTab ? "1" : "0.7",
            background:
              "radial-gradient(circle at 32% 26%, color-mix(in oklch, white 35%, var(--primary)) 0%, var(--primary) 62%)",
            boxShadow:
              "0 14px 22px -6px rgba(0,0,0,0.55), 0 6px 14px -3px color-mix(in oklch, var(--primary) 65%, transparent)",
          }}
        />

        <div className="relative z-10 flex items-center py-2">
          {links.map((link, i) => {
            const active = isOnTab && i === index;
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
                      ? "-translate-y-[22px] text-primary-foreground"
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
