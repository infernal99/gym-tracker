"use client";

import { Suspense, useEffect, useRef } from "react";
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

// Drives the camera to a preset front/back/side position with a smooth ease
// only right after a view button is pressed, then gets out of the way
// completely. It used to re-check the distance to that preset on *every*
// frame regardless of why the camera had moved — so any manual drag away
// from a preset was immediately fought and pulled back, which is why
// rotating used to feel like it "snapped back" on its own. A drag start
// also cancels a running animation outright, so grabbing the model
// mid-transition doesn't fight the user either.
//
// Triggers off `requestId` rather than `view` alone: re-pressing the
// already-selected preset (after drifting away from it with a manual drag)
// needs to re-trigger the animation too, and a same-value `view` prop
// wouldn't do that on its own.
function CameraRig({
  view,
  requestId,
  controlsRef,
}: {
  view: AnatomyView;
  requestId: number;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const currentView = useRef(view);
  const animating = useRef(true); // true on mount so it eases into the initial front view too
  const lastRequestId = useRef(requestId);

  useEffect(() => {
    currentView.current = view;
    if (requestId !== lastRequestId.current) {
      lastRequestId.current = requestId;
      animating.current = true;
    }
  }, [view, requestId]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancel = () => {
      animating.current = false;
    };
    controls.addEventListener("start", cancel);
    return () => controls.removeEventListener("start", cancel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlsRef.current]);

  useFrame((_, delta) => {
    if (animating.current) {
      const target = VIEW_POSITIONS[currentView.current];
      const dist = camera.position.distanceTo(target);
      if (dist < 0.01) {
        animating.current = false;
      } else {
        camera.position.lerp(target, Math.min(1, delta * 4));
      }
    }
    // Needed every frame regardless of the rig's own animation — this is
    // also what makes OrbitControls' damping (inertia) actually apply.
    controlsRef.current?.update();
  });

  return null;
}

export function MuscleBodyScene({
  active,
  hovered,
  viewRequest,
  onSelect,
  onHover,
}: {
  active: AnatomyGroup | null;
  hovered: AnatomyGroup | null;
  viewRequest: { view: AnatomyView; requestId: number };
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

      <CameraRig view={viewRequest.view} requestId={viewRequest.requestId} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.4}
        minDistance={2.2}
        maxDistance={5}
        target={[0, 0.1, 0]}
      />
    </Canvas>
  );
}
