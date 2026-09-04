"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { HumanModel } from "./HumanModel";
import type { AnatomyGroup } from "@/lib/anatomy-groups";
import type { AnatomyView } from "./AnatomyControls";

const VIEW_POSITIONS: Record<AnatomyView, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0.1, 3.4),
  back: new THREE.Vector3(0, 0.1, -3.4),
  side: new THREE.Vector3(3.4, 0.1, 0),
  free: new THREE.Vector3(0, 0.1, 3.4),
};

// Drives the camera to a preset front/back/side position with a smooth
// ease whenever `view` changes, then just stops updating — OrbitControls
// (always mounted, never disabled) picks up free dragging from wherever
// the camera ends up, no explicit "hand back control" step needed.
function CameraRig({ view, controlsRef }: { view: AnatomyView; controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  const target = useRef(VIEW_POSITIONS[view].clone());

  target.current = VIEW_POSITIONS[view];

  useFrame((_, delta) => {
    const dist = camera.position.distanceTo(target.current);
    if (dist < 0.01) return;
    camera.position.lerp(target.current, Math.min(1, delta * 4));
    controlsRef.current?.update();
  });

  return null;
}

export function MuscleBodyScene({
  active,
  hovered,
  view,
  onSelect,
  onHover,
}: {
  active: AnatomyGroup | null;
  hovered: AnatomyGroup | null;
  view: AnatomyView;
  onSelect: (group: AnatomyGroup) => void;
  onHover: (group: AnatomyGroup | null) => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 3.4], fov: 32 }}
      gl={{ antialias: true, alpha: true }}
      style={{ touchAction: "none" }}
    >
      {/* Soft studio lighting: no single hard key light, so there are no
          hard plastic-looking specular hotspots. */}
      <ambientLight intensity={0.65} />
      <directionalLight position={[2, 3, 3]} intensity={0.9} />
      <directionalLight position={[-2.5, 1, -2]} intensity={0.35} />
      {/* Faint rim light from behind to separate the figure from the
          background without it reading as a glow. */}
      <directionalLight position={[0, 1, -3.5]} intensity={0.3} />

      <Suspense fallback={null}>
        <HumanModel active={active} hovered={hovered} onSelect={onSelect} onHover={onHover} />
        <ContactShadows position={[0, -0.9, 0]} opacity={0.35} blur={2.2} far={1.2} />
      </Suspense>

      <CameraRig view={view} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={2.2}
        maxDistance={5}
        target={[0, 0.1, 0]}
      />
    </Canvas>
  );
}
