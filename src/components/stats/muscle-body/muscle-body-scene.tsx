"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { HumanBody } from "./human-body";
import type { MuscleZone } from "@/lib/muscle-colors";

// The Canvas + lighting + camera rig. Kept separate from HumanBody itself so
// this file is the only one that needs to know about R3F's Canvas — mirrors
// the split used for Velhoura's hero scene.
export function MuscleBodyScene({
  active,
  onSelect,
}: {
  active: MuscleZone | null;
  onSelect: (zone: MuscleZone) => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 2.9], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 3]} intensity={1.1} />
      <directionalLight position={[-2, 1, -2]} intensity={0.4} />

      <Suspense fallback={null}>
        <HumanBody active={active} onSelect={onSelect} />
      </Suspense>

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2 - 0.5}
        maxPolarAngle={Math.PI / 2 + 0.3}
        rotateSpeed={0.6}
        target={[0, 0.1, 0]}
      />
    </Canvas>
  );
}
