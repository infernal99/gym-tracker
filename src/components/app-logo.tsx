import Image from "next/image";

// The icon file already has its own rounded corners baked in (it's the
// same artwork used for the PWA/home-screen icon) — rounded-lg here clips
// the few dark antialiased corner pixels left outside that shape, rather
// than rounding a already-square image.
//
// The ?v= query bumps whenever the icon artwork itself changes — the file
// path never does, so without this browsers/CDNs that cached the old
// bytes at that URL keep serving them indefinitely after a fix ships.
const ICON_VERSION = "3";

export function AppLogo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src={`/icons/icon-192.png?v=${ICON_VERSION}`}
      alt="Gym Tracker"
      width={size}
      height={size}
      className="rounded-lg"
      priority
      unoptimized
    />
  );
}
