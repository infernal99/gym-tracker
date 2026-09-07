"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { resolveBottomNavLinks } from "@/components/nav/links";

const MORPH_MS = 420;

// Ball center, measured from the bar's own top edge — also where the
// active icon gets lifted to (see its translate below), and where the
// socket behind the ball is centered.
const BALL_TOP = 4;

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

        {/* A solid disc in the page's own background color, bigger than the
            ball and always concentric with it — since nothing but that flat
            background ever sits directly behind the nav, painting over the
            bar with it here reads exactly like a real notch: the bar's
            material visibly makes way for the ball instead of the ball
            just being drawn on top of it. */}
        <div
          aria-hidden
          className="ease-liquid pointer-events-none absolute h-16 w-16 rounded-full bg-background transition-[left] duration-[420ms]"
          style={ballPosition}
        />

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
