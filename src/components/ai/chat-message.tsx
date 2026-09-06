import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { AIMascotAvatar } from "@/components/ai/ai-mascot-avatar";

// The model writes light markdown (**bold**, *italic*, "1." lists, "- "
// bullets). Rendering it raw looks broken, and pulling in a full markdown
// parser for four constructs would be overkill — this covers what it
// actually emits.
function renderInline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={`${keyPrefix}-${i}`} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

function FormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const listMatch = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
        if (listMatch) {
          return (
            <span key={i} className="flex gap-1.5">
              <span className="shrink-0 text-muted-foreground">•</span>
              <span>{renderInline(listMatch[1], `l${i}`)}</span>
            </span>
          );
        }
        return (
          <span key={i} className={cn("block", !line.trim() && "h-2")}>
            {renderInline(line, `p${i}`)}
          </span>
        );
      })}
    </>
  );
}

export function ChatMessage({
  role,
  content,
  pending,
}: {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      {!isUser && <AIMascotAvatar size={28} animated={pending && !content} />}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1 rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border bg-card text-foreground",
        )}
      >
        {content ? (
          <FormattedContent content={content} />
        ) : pending ? (
          <span className="inline-flex gap-1 py-0.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
          </span>
        ) : null}
      </div>
    </div>
  );
}
