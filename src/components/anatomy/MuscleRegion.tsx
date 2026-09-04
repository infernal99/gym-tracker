import * as THREE from "three";
import type { AnatomyGroup } from "@/lib/anatomy-groups";

// Not a JSX-emitting component, deliberately: the GLTF's node graph has
// extra unnamed group nodes gltfpack inserted between the scene root and
// each named mesh (confirmed by inspecting the exported file). Re-declaring
// one of those meshes as its own `<primitive object={mesh} .../>` nested
// inside `<primitive object={scene}>` would make Three.js re-parent it
// directly under the scene root (Object3D.add() detaches from the old
// parent first) — silently dropping whichever transform that wrapper node
// carried. R3F's pointer events raycast against a primitive's *whole*
// descendant tree and report the exact mesh hit via `event.object`, so
// HumanModel attaches one set of handlers to the untouched scene primitive
// instead and uses the helpers below to interpret `event.object` — no
// reparenting, no separate per-mesh JSX element needed.

export type RegionState = "neutral" | "selected" | "dimmed" | "hovered";

const NEUTRAL = "#9a9d9f";
const DIMMED = "#6b6e70";

export function groupFromMeshName(name: string): AnatomyGroup | null {
  return name.startsWith("zone__") ? (name.slice("zone__".length) as AnatomyGroup) : null;
}

// The exported glTF wraps each mesh in a named parent node rather than
// naming the mesh itself (confirmed by inspecting the file's raw JSON:
// "zone__chest" is a Group with one unnamed child holding the actual
// geometry) — gltfpack's -kn flag preserves the node it's asked to keep
// named, which here is that wrapper, not the mesh. So both directions need
// to walk the hierarchy: this checks an object and its ancestors, and
// HumanModel's own setup pass looks at a mesh's parent, not the mesh, to
// find its zone.
export function groupFromObject(object: THREE.Object3D | null): AnatomyGroup | null {
  let current: THREE.Object3D | null = object;
  while (current) {
    const group = groupFromMeshName(current.name);
    if (group) return group;
    current = current.parent;
  }
  return null;
}

export function isSkeletonObject(object: THREE.Object3D | null): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current.name.startsWith("skeleton__")) return true;
    current = current.parent;
  }
  return false;
}

export function createRegionMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.02 });
}

// Called every frame for every tracked region — cheap uniform updates on an
// existing material, no allocation.
export function applyRegionState(
  material: THREE.MeshStandardMaterial,
  state: RegionState,
  color: string,
  elapsedTime: number,
) {
  if (state === "selected") {
    const pulse = 0.5 + Math.sin(elapsedTime * 3) * 0.18;
    material.color.set(color);
    material.emissive.set(color);
    material.emissiveIntensity = pulse;
  } else if (state === "hovered") {
    material.color.set(color);
    material.emissive.set(color);
    material.emissiveIntensity = 0.18;
  } else if (state === "dimmed") {
    material.color.set(DIMMED);
    material.emissive.set("#000000");
    material.emissiveIntensity = 0;
  } else {
    material.color.set(NEUTRAL);
    material.emissive.set("#000000");
    material.emissiveIntensity = 0;
  }
}
