"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MuscleZone } from "@/lib/muscle-colors";

const SKIN = "#8a8f98";
const ZONE_COLOR: Record<MuscleZone, string> = {
  chest: "#ef4444",
  back: "#3b82f6",
  legs: "#22c55e",
  shoulders: "#f97316",
  arms: "#a855f7",
  core: "#eab308",
};

interface PartProps {
  zone: MuscleZone;
  active: MuscleZone | null;
  onSelect: (zone: MuscleZone) => void;
  position: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
}

// One clickable body region. Neutral skin tone at rest; the active zone
// glows via emissive (a real "light up", not just a flat color swap) and
// pulses gently so it keeps reading as selected even in a still pose.
function ZonePart({ zone, active, onSelect, position, rotation, children }: PartProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isActive = active === zone;
  const color = useMemo(() => new THREE.Color(isActive ? ZONE_COLOR[zone] : SKIN), [isActive, zone]);

  useFrame(({ clock }) => {
    const mat = meshRef.current?.material as THREE.MeshStandardMaterial | undefined;
    if (!mat) return;
    if (isActive) {
      const pulse = 0.55 + Math.sin(clock.elapsedTime * 3) * 0.2;
      mat.emissiveIntensity = pulse;
    } else {
      mat.emissiveIntensity = 0;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(zone);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {children}
      <meshStandardMaterial
        color={color}
        emissive={ZONE_COLOR[zone]}
        emissiveIntensity={0}
        roughness={0.55}
        metalness={0.05}
        opacity={hovered && !isActive ? 0.85 : 1}
        transparent={hovered && !isActive}
      />
    </mesh>
  );
}

function Neutral({
  position,
  rotation,
  children,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      {children}
      <meshStandardMaterial color={SKIN} roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

export function HumanBody({
  active,
  onSelect,
}: {
  active: MuscleZone | null;
  onSelect: (zone: MuscleZone) => void;
}) {
  return (
    <group position={[0, -0.95, 0]}>
      {/* Head + neck — always neutral, not a trackable zone. */}
      <Neutral position={[0, 1.58, 0]}>
        <sphereGeometry args={[0.13, 24, 24]} />
      </Neutral>
      <Neutral position={[0, 1.42, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.1, 16]} />
      </Neutral>

      {/* Torso */}
      <ZonePart zone="back" active={active} onSelect={onSelect} position={[0, 1.05, -0.11]}>
        <boxGeometry args={[0.5, 0.56, 0.16]} />
      </ZonePart>
      <ZonePart zone="chest" active={active} onSelect={onSelect} position={[0, 1.2, 0.12]}>
        <boxGeometry args={[0.44, 0.26, 0.2]} />
      </ZonePart>
      <ZonePart zone="core" active={active} onSelect={onSelect} position={[0, 0.87, 0.1]}>
        <boxGeometry args={[0.36, 0.28, 0.16]} />
      </ZonePart>

      {/* Pelvis — neutral. */}
      <Neutral position={[0, 0.62, 0]}>
        <boxGeometry args={[0.42, 0.16, 0.22]} />
      </Neutral>

      {/* Shoulders (deltoids) */}
      <ZonePart zone="shoulders" active={active} onSelect={onSelect} position={[0.33, 1.33, 0]}>
        <sphereGeometry args={[0.115, 20, 20]} />
      </ZonePart>
      <ZonePart zone="shoulders" active={active} onSelect={onSelect} position={[-0.33, 1.33, 0]}>
        <sphereGeometry args={[0.115, 20, 20]} />
      </ZonePart>

      {/* Arms — upper arm + forearm as one capsule each, tilted slightly out. */}
      <ZonePart
        zone="arms"
        active={active}
        onSelect={onSelect}
        position={[0.42, 0.95, 0.02]}
        rotation={[0, 0, -0.12]}
      >
        <capsuleGeometry args={[0.075, 0.55, 6, 12]} />
      </ZonePart>
      <ZonePart
        zone="arms"
        active={active}
        onSelect={onSelect}
        position={[-0.42, 0.95, 0.02]}
        rotation={[0, 0, 0.12]}
      >
        <capsuleGeometry args={[0.075, 0.55, 6, 12]} />
      </ZonePart>

      {/* Hands — neutral. */}
      <Neutral position={[0.46, 0.62, 0.02]}>
        <sphereGeometry args={[0.06, 14, 14]} />
      </Neutral>
      <Neutral position={[-0.46, 0.62, 0.02]}>
        <sphereGeometry args={[0.06, 14, 14]} />
      </Neutral>

      {/* Legs — thigh + calf per side, both tagged "legs" (glutes/quads/
          hamstrings/calves all map to the same zone in this app). */}
      <ZonePart zone="legs" active={active} onSelect={onSelect} position={[0.15, 0.32, 0]}>
        <capsuleGeometry args={[0.11, 0.42, 6, 12]} />
      </ZonePart>
      <ZonePart zone="legs" active={active} onSelect={onSelect} position={[-0.15, 0.32, 0]}>
        <capsuleGeometry args={[0.11, 0.42, 6, 12]} />
      </ZonePart>
      <ZonePart zone="legs" active={active} onSelect={onSelect} position={[0.15, -0.15, -0.01]}>
        <capsuleGeometry args={[0.08, 0.38, 6, 12]} />
      </ZonePart>
      <ZonePart zone="legs" active={active} onSelect={onSelect} position={[-0.15, -0.15, -0.01]}>
        <capsuleGeometry args={[0.08, 0.38, 6, 12]} />
      </ZonePart>

      {/* Feet — neutral. */}
      <Neutral position={[0.15, -0.42, 0.05]}>
        <boxGeometry args={[0.12, 0.07, 0.22]} />
      </Neutral>
      <Neutral position={[-0.15, -0.42, 0.05]}>
        <boxGeometry args={[0.12, 0.07, 0.22]} />
      </Neutral>
    </group>
  );
}
