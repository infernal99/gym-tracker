"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { resolveBottomNavLinks } from "@/components/nav/links";

const MORPH_MS = 420;

export function MobileNav({ hrefs }: { hrefs: string[] }) {
  const pathname = usePathname();
  const links = resolveBottomNavLinks(hrefs);

  const activeIndex = links.findIndex(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );
  const index = activeIndex === -1 ? 0 : activeIndex;

  // Briefly stretches the blob along its direction of travel so the slide
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

  return (
    <nav className="sticky bottom-0 z-50 shrink-0 px-3 pb-3 pt-1">
      <div className="relative flex items-center overflow-visible rounded-full border bg-surface/95 py-2 shadow-lg shadow-black/30 backdrop-blur">
        {/* Bubble rests with its center on the bar's top edge — enough of
            it pokes out to read as sitting on top of the bar (not flush
            inside it), without floating high enough to cover the page
            content above the nav. Its own center is what the active icon
            below gets lifted to line up with (see the icon's translate). */}
        <div
          aria-hidden
          className={cn(
            "ease-liquid pointer-events-none absolute h-12 rounded-full transition-[left,width] duration-[420ms]",
            morphing ? "w-16" : "w-12",
          )}
          style={{
            left: `${(index + 0.5) * (100 / links.length)}%`,
            top: "10px",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle at 32% 26%, color-mix(in oklch, white 35%, var(--primary)) 0%, var(--primary) 62%)",
            boxShadow:
              "0 14px 22px -8px rgba(0,0,0,0.55), 0 6px 14px -3px color-mix(in oklch, var(--primary) 65%, transparent)",
          }}
        />
        {links.map((link, i) => {
          const active = i === index;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="relative z-10 flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium"
            >
              <Icon
                className={cn(
                  "ease-liquid h-5 w-5 transition-[color,transform] duration-[420ms]",
                  active ? "-translate-y-3 text-primary-foreground" : "text-muted-foreground",
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
    </nav>
  );
}
