"use client";

import { useMemo, useRef } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { groupFromObject, isSkeletonObject, createRegionMaterial, applyRegionState } from "./MuscleRegion";
import { ANATOMY_GROUP_ZONE, type AnatomyGroup } from "@/lib/anatomy-groups";

const MODEL_URL = "/models/anatomy-body.glb";

useGLTF.preload(MODEL_URL);

export function HumanModel({
  active,
  hovered,
  onSelect,
  onHover,
}: {
  active: AnatomyGroup | null;
  hovered: AnatomyGroup | null;
  onSelect: (group: AnatomyGroup) => void;
  onHover: (group: AnatomyGroup | null) => void;
}) {
  const { scene } = useGLTF(MODEL_URL);

  // One material per clickable region, created once and mutated in place
  // every frame (see useFrame below) rather than swapped — avoids
  // re-triggering Three.js material compilation on every hover/select.
  const regionMaterials = useRef(new Map<AnatomyGroup, THREE.MeshStandardMaterial>());

  // Wires materials onto the loaded meshes and normalizes the model's scale/
  // position — both need to happen once per loaded scene, and both only
  // need to read geometry, so they share this one pass instead of two.
  const { scale, center } = useMemo(() => {
    // The centering box only measures the 12 muscle meshes, never the
    // skeleton — the skeleton geometry in the source file turns out to be
    // measurably asymmetric left/right (confirmed by direct inspection: the
    // muscle groups are all centered within a millimeter of x=0, but the
    // skeleton's own bounding box center sits ~0.33 units off to one side).
    // Centering on the combined box shifted the correctly-centered torso off
    // to the side to compensate for the skeleton's own lopsidedness.
    const muscleBox = new THREE.Box3();
    // Only the skeleton reliably spans full head-to-toe height (the muscles
    // don't cover the skull or feet) — still used for vertical size/centering,
    // just not for the horizontal (X) center.
    const fullBox = new THREE.Box3();
    let skeletonMesh: THREE.Mesh | null = null;

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      fullBox.expandByObject(child);

      // The mesh's own name is blank — gltfpack's -kn flag preserved the
      // *parent* group's name ("zone__chest" etc.), not the mesh's (see
      // groupFromObject's comment in MuscleRegion.tsx).
      const group = groupFromObject(child);
      if (group) {
        muscleBox.expandByObject(child);
        const mat = createRegionMaterial();
        regionMaterials.current.set(group, mat);
        child.material = mat;
      } else if (isSkeletonObject(child)) {
        skeletonMesh = child;
      }
    });

    if (skeletonMesh) {
      (skeletonMesh as THREE.Mesh).material = new THREE.MeshStandardMaterial({
        color: "#c9c6bd",
        roughness: 0.85,
        metalness: 0.02,
      });
    }

    const size = new THREE.Vector3();
    fullBox.getSize(size);
    const boxCenter = new THREE.Vector3();
    fullBox.getCenter(boxCenter);
    const muscleCenter = new THREE.Vector3();
    muscleBox.getCenter(muscleCenter);
    boxCenter.x = muscleCenter.x;
    const targetHeight = 1.8;
    return { scale: targetHeight / (size.y || 1), center: boxCenter };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  useFrame(({ clock }) => {
    for (const [group, mat] of regionMaterials.current) {
      const zone = ANATOMY_GROUP_ZONE[group];
      const color = getComputedColor(zone);
      const state =
        active === group ? "selected" : active ? "dimmed" : hovered === group ? "hovered" : "neutral";
      applyRegionState(mat, state, color, clock.elapsedTime);
    }
  });

  function handleClick(e: ThreeEvent<MouseEvent>) {
    const group = groupFromObject(e.object);
    if (!group) return;
    e.stopPropagation();
    onSelect(group);
  }

  function handlePointerMove(e: ThreeEvent<PointerEvent>) {
    const group = groupFromObject(e.object);
    if (group) {
      e.stopPropagation();
      onHover(group);
      document.body.style.cursor = "pointer";
    }
  }

  function handlePointerOut() {
    onHover(null);
    document.body.style.cursor = "auto";
  }

  return (
    <group scale={scale}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive
          object={scene}
          onClick={handleClick}
          onPointerMove={handlePointerMove}
          onPointerOut={handlePointerOut}
        />
      </group>
    </group>
  );
}

const HEX_CACHE: Record<string, string> = {};
// Three.js materials need a real hex/rgb color, not a CSS var() string — the
// design tokens are only defined on :root as CSS custom properties.
function getComputedColor(zone: string): string {
  if (HEX_CACHE[zone]) return HEX_CACHE[zone];
  if (typeof window === "undefined") return "#999999";
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--muscle-${zone}`).trim();
  HEX_CACHE[zone] = value || "#999999";
  return HEX_CACHE[zone];
}
