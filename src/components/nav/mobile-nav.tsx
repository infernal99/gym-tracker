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
        {/* Bubble pops up out of the bar's top edge, like a blob rising to
            the surface, rather than sitting flush inside it. */}
        <div
          aria-hidden
          className={cn(
            "ease-liquid pointer-events-none absolute top-0 h-14 rounded-full bg-primary shadow-[0_10px_20px_-4px] shadow-primary/60 transition-[left,width] duration-[420ms]",
            morphing ? "w-20" : "w-14",
          )}
          style={{
            left: `${(index + 0.5) * (100 / links.length)}%`,
            transform: "translate(-50%, -62%)",
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
                  active
                    ? "-translate-y-3.5 text-primary-foreground"
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
    </nav>
  );
}
