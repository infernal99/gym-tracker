import Image from "next/image";
import { cn } from "@/lib/utils";

export function AIMascotAvatar({
  size = 28,
  className,
  animated,
}: {
  size?: number;
  className?: string;
  /** Nods gently while the assistant is actively working on a reply. */
  animated?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10",
        animated && "mascot-nod",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/mascot/gym-buddy-face.png"
        alt="Gym Tracker AI"
        width={size}
        height={size}
        className="h-full w-full scale-125 object-cover"
      />
    </div>
  );
}
