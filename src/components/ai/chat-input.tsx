"use client";

import { useRef } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t bg-background/95 pt-3 backdrop-blur">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Pregúntame algo sobre tu entrenamiento..."
        className="max-h-32 flex-1 resize-none rounded-2xl border bg-card px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary"
      />
      <Button
        type="button"
        size="icon"
        className="shrink-0 rounded-full"
        disabled={disabled || !value.trim()}
        onClick={onSend}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
