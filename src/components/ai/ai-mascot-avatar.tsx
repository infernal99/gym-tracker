import Image from "next/image";
import { cn } from "@/lib/utils";

export function AIMascotAvatar({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10",
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
