"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, PointLight } from "three";
import { SceneCanvas } from "../SceneCanvas";

/**
 * Step 03's bench.
 *
 * The smallest scene that exercises everything the boundary has to support:
 * a ground plane, silhouetted distance, a warm point light that breathes, and
 * one object that reacts. No camp, no portfolio content, no interaction
 * model — those arrive in later steps, on top of this.
 *
 * If this renders, loads as its own chunk, and disposes cleanly, the boundary
 * works and Camp can be built behind it.
 */
function Rig() {
  const fire = useRef<PointLight | null>(null);
  const marker = useRef<Mesh | null>(null);
  const ridges = useRef<Group | null>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Firelight: two out-of-phase sines, so it never reads as a loop.
    if (fire.current) {
      fire.current.intensity = 9 + Math.sin(t * 2.7) * 1.6 + Math.sin(t * 6.1) * 0.7;
    }

    if (marker.current) {
      marker.current.rotation.y = t * 0.22;
    }

    // The camera does not move; the world drifts a hair instead. Cheaper, and
    // it never fights a camera controller added later.
    if (ridges.current) {
      ridges.current.position.x = Math.sin(t * 0.06) * 0.35;
    }
  });

  return (
    <>
      {/* Dusk: one low warm key, a cool ambient fill, no shadow maps. */}
      <ambientLight intensity={0.9} color="#6b7688" />
      <directionalLight position={[-6, 4, -8]} intensity={1.6} color="#d89a5e" />
      <pointLight ref={fire} position={[0, 0.5, 1.2]} intensity={9} distance={14} color="#e8924a" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#4a3a2a" roughness={1} metalness={0} />
      </mesh>

      {/* Distance, as silhouettes rather than terrain. */}
      <group ref={ridges} position={[0, 0, -22]}>
        {[
          { x: -14, s: 9, z: 0, c: "#3a3028" },
          { x: -3, s: 12, z: -6, c: "#2e261f" },
          { x: 11, s: 10, z: -2, c: "#262019" },
          { x: 22, s: 14, z: -9, c: "#1d1813" },
        ].map((ridge, i) => (
          <mesh key={i} position={[ridge.x, ridge.s / 2 - 1.5, ridge.z]}>
            <coneGeometry args={[ridge.s * 0.8, ridge.s, 4]} />
            <meshBasicMaterial color={ridge.c} />
          </mesh>
        ))}
      </group>

      {/* The object under the light. */}
      <mesh ref={marker} position={[0, 0.1, 1.2]} castShadow={false}>
        <boxGeometry args={[0.9, 0.6, 0.14]} />
        <meshStandardMaterial color="#d8c7a5" roughness={0.85} />
      </mesh>

      {/* Embers: a handful of points, not a particle system. */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={`ember-${i}`} position={[
          Math.sin(i * 2.7) * 0.7,
          0.4 + (i % 5) * 0.34,
          1.2 + Math.cos(i * 1.9) * 0.5,
        ]}>
          <sphereGeometry args={[0.018, 6, 6]} />
          <meshBasicMaterial color="#e8b070" />
        </mesh>
      ))}
    </>
  );
}

export function BenchScene() {
  return (
    <SceneCanvas
      background="#120e0b"
      fog={{ color: "#120e0b", near: 12, far: 46 }}
      camera={{ position: [0, 1.3, 5.4], fov: 44 }}
    >
      <Rig />
    </SceneCanvas>
  );
}
