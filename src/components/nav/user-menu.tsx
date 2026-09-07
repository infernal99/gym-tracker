"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";
import { navLinks } from "@/components/nav/links";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  displayName,
  username,
  avatarUrl,
  level,
  bottomNavHrefs,
}: {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  bottomNavHrefs: string[];
}) {
  // Driving the icon from React state rather than from Base UI's
  // data-popup-open attribute: the group-data variant for it never compiled
  // to any CSS here, so the bars silently stayed put. An explicit boolean
  // and plain conditional classes can't fail that way.
  const [open, setOpen] = useState(false);
  const otherLinks = navLinks.filter((link) => !bottomNavHrefs.includes(link.href));
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      {/* The three bars fold into a cross while the menu is open, so the
          button states what it will do next instead of just sitting there.
          Base UI puts data-popup-open on the trigger, which is what drives
          it — no open state to mirror in React. */}
      <DropdownMenuTrigger
        aria-label="Abrir menú"
        className="group flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors duration-fast ease-out hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {/* 14px tall, bars 2px each at 0 / 6 / 12, so folding the outer two
            by exactly 6px lands all three centres on the same line and the
            rotation reads as a cross. Every offset is on the spacing scale
            and the variant is the bare `data-popup-open:` this codebase
            already uses — nesting brackets inside a bracketed variant
            (`group-data-[popup-open]:translate-y-[7px]`) silently dropped
            the translate and left the bars rotated in place as a chevron. */}
        <span aria-hidden className="relative block h-3.5 w-5">
          <span
            className={cn(
              "absolute left-0 top-0 block h-0.5 w-full rounded-full bg-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
              open && "translate-y-1.5 rotate-45",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-1.5 block h-0.5 w-full rounded-full bg-foreground transition-opacity duration-200 ease-out motion-reduce:transition-none",
              open && "opacity-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-3 block h-0.5 w-full rounded-full bg-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
              open && "-translate-y-1.5 -rotate-45",
            )}
          />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {/* The avatar moves in here: the trigger no longer carries it, and
            this is where you'd look to check whose account you're in. */}
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <Avatar className="h-9 w-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-none">{displayName}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              @{username} · Nivel {level}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {otherLinks.map((link) => {
          const Icon = link.icon;
          return (
            <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
              <Icon className="mr-2 h-4 w-4" />
              {link.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="mr-2 h-4 w-4" />
          Ajustes
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<form action={logoutAction} />}>
          <button type="submit" className="flex w-full items-center">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
