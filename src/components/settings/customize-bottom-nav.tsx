"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { updateBottomNavAction } from "@/lib/actions/settings";
import { navLinks, BOTTOM_NAV_SLOT_COUNT } from "@/components/nav/links";
import type { ActionResult } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

const initialState: ActionResult = { error: null };

export function CustomizeBottomNav({ initialHrefs }: { initialHrefs: string[] }) {
  const [state, formAction, pending] = useActionState(updateBottomNavAction, initialState);
  const [selected, setSelected] = useState<string[]>(initialHrefs);

  function toggle(href: string) {
    setSelected((prev) => {
      if (prev.includes(href)) return prev.filter((h) => h !== href);
      if (prev.length >= BOTTOM_NAV_SLOT_COUNT) return prev;
      return [...prev, href];
    });
  }

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Elige {BOTTOM_NAV_SLOT_COUNT} pestañas para la barra inferior ({selected.length}/
        {BOTTOM_NAV_SLOT_COUNT}).
      </p>
      <div className="grid grid-cols-2 gap-2">
        {navLinks.map((link) => {
          const isSelected = selected.includes(link.href);
          const disabled = !isSelected && selected.length >= BOTTOM_NAV_SLOT_COUNT;
          const Icon = link.icon;
          return (
            <button
              key={link.href}
              type="button"
              disabled={disabled}
              onClick={() => toggle(link.href)}
              className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition-colors duration-fast ${
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : disabled
                    ? "border-border text-muted-foreground/50"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{link.label}</span>
              {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
      {selected.map((href) => (
        <input key={href} type="hidden" name="hrefs" value={href} />
      ))}
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={pending || selected.length !== BOTTOM_NAV_SLOT_COUNT}
      >
        {pending ? "Guardando..." : "Guardar barra inferior"}
      </Button>
    </form>
  );
}
