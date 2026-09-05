import type { PhotoAngle } from "@/lib/photo-angles";

// Simple humanoid outlines, one per angle, all sharing the same bounding
// box (viewBox 0 0 100 200, figure roughly from y=8 to y=192) — that shared
// box is also what GuidedCameraCapture measures the detected pose against,
// so the outline the user sees is literally the target the pose check uses.
const PATHS: Record<PhotoAngle, string> = {
  front:
    "M50 8 a10 10 0 1 0 0.1 0 M50 28 l0 45 M30 40 q20 -8 40 0 M30 40 l-8 55 M70 40 l8 55 M50 73 l-16 60 M50 73 l16 60 M22 95 l8 3 M78 95 l-8 3",
  back:
    "M50 8 a10 10 0 1 0 0.1 0 M50 28 l0 45 M30 38 q20 -6 40 0 M30 38 l-7 55 M70 38 l7 55 M50 73 l-15 60 M50 73 l15 60",
  side:
    "M58 8 a10 10 0 1 0 0.1 0 M55 28 q-4 20 2 45 M50 40 q10 -4 18 4 M50 40 l-6 50 M68 44 l4 50 M52 90 l-8 60 M56 90 l14 60",
};

export function SilhouetteOverlay({ angle }: { angle: PhotoAngle }) {
  return (
    <svg
      viewBox="0 0 100 200"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <path
        d={PATHS[angle]}
        fill="none"
        stroke="white"
        strokeOpacity={0.55}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The pose check compares the detected person's bounding box against this —
// normalized [0,1] image coordinates, y measured from the top. Kept in sync
// with the outlines above by construction (both describe the same figure).
export const SILHOUETTE_TARGET_BOX = {
  xMin: 0.22,
  xMax: 0.78,
  yMin: 0.04,
  yMax: 0.96,
};
