import Image from "next/image";

// The icon file already has its own rounded corners baked in (it's the
// same artwork used for the PWA/home-screen icon) — rounded-lg here clips
// the few dark antialiased corner pixels left outside that shape, rather
// than rounding a already-square image.
export function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/icons/icon-192.png"
      alt="Gym Tracker"
      width={size}
      height={size}
      className="rounded-lg"
      priority
    />
  );
}
