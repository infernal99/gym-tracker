"use client";

import { History, MessageSquarePlus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AIConversationSummary } from "@/lib/services/ai-chat";

// A centered dialog rather than a side sheet on purpose: every overlay in
// this app portals to <body>, and the app itself renders inside a centered
// ~430px phone frame — a left-anchored sheet would slide in from the real
// browser edge, far outside the frame. Centered overlays land over the
// frame, like the rest of the app's modals.
export function ConversationHistory({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: {
  conversations: AIConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <History className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conversaciones</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
          <DialogClose
            render={
              <button
                type="button"
                onClick={onNew}
                className="mb-1 flex items-center gap-2 rounded-xl border border-dashed p-3 text-sm font-medium text-muted-foreground transition-colors duration-fast hover:border-foreground/30 hover:text-foreground"
              />
            }
          >
            <MessageSquarePlus className="h-4 w-4" />
            Nueva conversación
          </DialogClose>

          {conversations.length === 0 && (
            <p className="px-1 py-4 text-center text-xs text-muted-foreground">
              Todavía no tienes conversaciones.
            </p>
          )}

          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "group flex items-center gap-1 rounded-xl",
                c.id === activeId ? "bg-primary/10" : "hover:bg-muted",
              )}
            >
              <DialogClose
                render={
                  <button
                    type="button"
                    onClick={() => onSelect(c.id)}
                    className="min-w-0 flex-1 p-3 text-left text-sm text-foreground"
                  />
                }
              >
                <span className="block truncate">{c.title}</span>
              </DialogClose>
              <button
                type="button"
                aria-label="Eliminar conversación"
                onClick={() => onDelete(c.id)}
                className="mr-2 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors duration-fast hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
