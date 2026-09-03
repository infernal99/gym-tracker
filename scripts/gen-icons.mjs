import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT_DIR = fileURLToPath(new URL("../public/icons/", import.meta.url));
mkdirSync(OUT_DIR, { recursive: true });

const PRIMARY = "#3B82F6";

// Rounded-square version — used for "any" purpose icons (browser tabs,
// desktop app icons), matching the in-app header logo badge.
const anySvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="${PRIMARY}" />
  <text x="256" y="326" font-family="Arial, Helvetica, sans-serif" font-weight="800"
        font-size="300" fill="white" text-anchor="middle">G</text>
</svg>`;

// Full-bleed, no rounding — the OS applies its own mask shape (circle,
// squircle, etc.), so content has to stay inside the ~80% "safe zone" or it
// gets clipped. Used for maskable icons and the Apple touch icon (iOS also
// rounds the corners itself).
const maskableSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="${PRIMARY}" />
  <text x="256" y="300" font-family="Arial, Helvetica, sans-serif" font-weight="800"
        font-size="220" fill="white" text-anchor="middle">G</text>
</svg>`;

async function make(svg, filename, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path.join(OUT_DIR, filename));
  console.log("wrote", filename);
}

await make(anySvg, "icon-192.png", 192);
await make(anySvg, "icon-512.png", 512);
await make(maskableSvg, "maskable-192.png", 192);
await make(maskableSvg, "maskable-512.png", 512);
await make(maskableSvg, "apple-touch-icon.png", 180);

console.log("done");
