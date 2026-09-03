"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { moreNavLinks } from "@/components/nav/links";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
        <Menu className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {moreNavLinks.map((link) => {
          const Icon = link.icon;
          return (
            <DropdownMenuItem key={link.href} render={<Link href={link.href} />}>
              <Icon className="mr-2 h-4 w-4" />
              {link.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
