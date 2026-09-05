"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
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
  const otherLinks = navLinks.filter((link) => !bottomNavHrefs.includes(link.href));
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
        <Avatar className="h-9 w-9">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium leading-none">{displayName}</p>
          <p className="text-xs text-muted-foreground">@{username} · Nivel {level}</p>
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
