"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { resolveBottomNavLinks } from "@/components/nav/links";

const MORPH_MS = 420;
const LIQUID_EASE = "cubic-bezier(0.34, 1.56, 0.64, 1)";

// Ball center, measured from the bar's own top edge — also where the
// active icon gets lifted to (see its translate below), and where the
// notch cut into the bar background is centered.
const BALL_TOP = 4;
const NOTCH_SIZE = 64;

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
  const maskTransition = `mask-position ${MORPH_MS}ms ${LIQUID_EASE}, -webkit-mask-position ${MORPH_MS}ms ${LIQUID_EASE}`;
  const notchMaskImage =
    "radial-gradient(circle, rgba(0,0,0,0) 0px 24px, rgba(0,0,0,1) 28px 100%)";

  return (
    <nav className="sticky bottom-0 z-50 shrink-0 px-3 pb-3 pt-1">
      <div className="relative">
        {/* The bar's own background+border, with a real hole punched out
            where the ball sits — the bar's material visibly parts around
            the ball instead of the ball just being drawn on top of it. */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border bg-surface/95 shadow-lg shadow-black/30 backdrop-blur"
          style={{
            maskImage: notchMaskImage,
            WebkitMaskImage: notchMaskImage,
            maskSize: `${NOTCH_SIZE}px ${NOTCH_SIZE}px`,
            WebkitMaskSize: `${NOTCH_SIZE}px ${NOTCH_SIZE}px`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: `calc(${leftPercent}% - ${NOTCH_SIZE / 2}px) ${BALL_TOP - NOTCH_SIZE / 2}px`,
            WebkitMaskPosition: `calc(${leftPercent}% - ${NOTCH_SIZE / 2}px) ${BALL_TOP - NOTCH_SIZE / 2}px`,
            transition: maskTransition,
          }}
        />

        {/* The ball itself, nested in the notch above. */}
        <div
          aria-hidden
          className={cn(
            "ease-liquid pointer-events-none absolute h-12 rounded-full transition-[left,width] duration-[420ms]",
            morphing ? "w-16" : "w-12",
          )}
          style={{
            left: `${leftPercent}%`,
            top: `${BALL_TOP}px`,
            transform: "translate(-50%, -50%)",
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
