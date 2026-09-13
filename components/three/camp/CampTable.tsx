"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { PointLight } from "three";
import { LANTERN, TABLE, TABLE_SIZE, TABLE_TOP } from "./layout";
import { camp, fire, props } from "./palette";

/**
 * The table, the lantern, and the things nobody is meant to click.
 *
 * §13 asks for a table that feels naturally cluttered and says plainly what
 * that rules out: objects arranged like a UI menu. The four a visitor can
 * actually pick up are placed in layout.ts on staggered positions, but
 * staggering alone does not make clutter — what makes a table read as used is
 * the things on it that do nothing. A mug someone set down and a pencil that
 * rolled are worth more here than a fifth interactive object, and §22 caps
 * interaction at four precisely so this layer can exist.
 */

/**
 * The lantern. §21: decorative, and the brief is blunt about why — not every
 * object needs to be a button.
 *
 * It earns its place by lighting. The fire is back and to the left, so
 * everything on the table would be lit from behind and read as silhouettes;
 * the lantern sits on the far corner and throws the objects' edges toward the
 * camera. That second source is what makes the table legible at all.
 *
 * Its flicker is slower and shallower than the fire's. A flame in a glass box
 * is sheltered — if it guttered like the open fire it would look like the same
 * light twice.
 */
function Lantern() {
  const glow = useRef<PointLight | null>(null);

  useFrame((state) => {
    if (!glow.current) return;
    const t = state.clock.elapsedTime;
    glow.current.intensity = 1.35 + Math.sin(t * 1.6) * 0.1 + Math.sin(t * 3.7) * 0.05;
  });

  return (
    <group position={LANTERN}>
      {/* Base and cap, dark: the frame is not the light. */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.075, 0.085, 0.04, 8]} />
        <meshStandardMaterial color={props.brass} roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.235, 0]}>
        <cylinderGeometry args={[0.085, 0.06, 0.05, 8]} />
        <meshStandardMaterial color={props.brass} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* The glass. Emissive rather than lit — it is the source, and a source
          that waits to be lit is a lamp that is off. */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.17, 8]} />
        <meshStandardMaterial
          color={props.glass}
          emissive={props.glass}
          emissiveIntensity={1.5}
          roughness={0.4}
        />
      </mesh>

      {/* The handle, which is most of what says "lantern" rather than "jar". */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.006, 4, 10, Math.PI]} />
        <meshStandardMaterial color={props.brass} roughness={0.8} metalness={0.3} />
      </mesh>

      <pointLight ref={glow} position={[0, 0.14, 0]} intensity={1.35} distance={3.4} decay={2} color={fire.core} />
    </group>
  );
}

/** A tin mug, set down and forgotten. Nothing happens if you look at it. */
function Mug() {
  return (
    <group position={[TABLE[0] - 0.74, TABLE_TOP, TABLE[2] + 0.3]} rotation={[0, 0.6, 0]}>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.045, 0.04, 0.09, 10]} />
        <meshStandardMaterial color={props.tin} roughness={0.6} metalness={0.35} />
      </mesh>
      <mesh position={[0.052, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.026, 0.005, 4, 8]} />
        <meshStandardMaterial color={props.tin} roughness={0.6} metalness={0.35} />
      </mesh>
    </group>
  );
}

/** A pencil that rolled until something stopped it. */
function Pencil() {
  return (
    <mesh
      position={[TABLE[0] - 0.18, TABLE_TOP + 0.006, TABLE[2] - 0.34]}
      rotation={[0, 0.42, Math.PI / 2]}
    >
      <cylinderGeometry args={[0.007, 0.007, 0.17, 6]} />
      <meshStandardMaterial color={props.ink} roughness={0.9} />
    </mesh>
  );
}

export function CampTable() {
  const [w, d] = TABLE_SIZE;

  return (
    <group>
      {/* The top. A slab with a little thickness — a plane would have no edge
          to catch the lantern, and the edge is what gives it weight. */}
      <mesh position={[TABLE[0], TABLE_TOP - 0.025, TABLE[2]]}>
        <boxGeometry args={[w, 0.05, d]} />
        <meshStandardMaterial color={camp.timber} roughness={0.92} />
      </mesh>

      {/* Four legs, splayed a touch. Trestle rather than furniture. */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh
          key={`leg-${i}`}
          position={[TABLE[0] + sx * (w / 2 - 0.12), (TABLE_TOP - 0.05) / 2, TABLE[2] + sz * (d / 2 - 0.1)]}
          rotation={[sz * 0.06, 0, -sx * 0.06]}
        >
          <boxGeometry args={[0.055, TABLE_TOP - 0.05, 0.055]} />
          <meshStandardMaterial color={camp.timberDark} roughness={1} />
        </mesh>
      ))}

      <Lantern />
      <Mug />
      <Pencil />
    </group>
  );
}
