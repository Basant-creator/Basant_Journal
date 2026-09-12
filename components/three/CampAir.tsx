"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, type Group, type Mesh, type Points } from "three";
import { createRng, seedFrom } from "@/lib/map/rng";
import { fire, scene } from "./palette";

/**
 * The smoke's cycle, taken from the 2D camp rather than invented again.
 *
 * The illustrated plumes are bezier paths and those do not transfer — but the
 * behaviour does, and the behaviour is what a viewer actually recognises: a
 * 15-second rise, two siblings at 1.27x and 1.53x of it so the three never
 * line up, and offsets so they do not all start from the ground together.
 * `--smoke-rise` in globals.css is the same 15s. Change one and the two
 * renderings drift apart.
 */
const PLUMES = [
  { period: 15, delay: 0, x: -0.06 },
  { period: 15 * 1.27, delay: 3, x: 0.05 },
  { period: 15 * 1.53, delay: 7, x: 0.01 },
] as const;

/**
 * A soft round blob, drawn once.
 *
 * Generated rather than loaded, for the same reason the wind is synthesised
 * and the ridges are seeded: there is no asset to ship, nothing to license,
 * and the thing that defines it is ten lines of gradient rather than a file.
 * Stretched tall by the mesh, one blob is a plume.
 */
function useSoftTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.28)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new CanvasTexture(canvas);
  }, []);

  /* R3F disposes what it renders; this was made outside the tree, so it is
     ours to clean up. A texture per mount, never released, is exactly how a
     scene that is entered and left a few times runs the GPU out of memory. */
  useEffect(() => () => texture?.dispose(), [texture]);

  return texture;
}

/**
 * The air in Camp.
 *
 * Smoke off the fire and dust in the light, and both are deliberately cheap:
 *
 *   **Three planes, not a particle system.** The 2D scene made the same call
 *   and said why — three plumes read as smoke, and a thousand particles read
 *   as a demo that has discovered particles. Each plane rises, fades in early,
 *   widens as it goes and fades out at the top, which is the whole of what
 *   smoke does at this distance.
 *
 *   **The dust never moves in its buffer.** Positions are seeded once and the
 *   group is rotated and bobbed instead, so there is no vertex upload on any
 *   frame. Animating sixty positions per frame would mean pushing a buffer to
 *   the GPU sixty times a second to move specks nobody is tracking — the same
 *   reasoning that made the 2D motes one composited gradient per depth rather
 *   than a hundred elements.
 *
 * Seeded, so the specks are in the same places on every visit and on every
 * machine. This scene is a place; a place does not rearrange itself.
 */
export function CampAir({ at = [0, 0, 0.9] }: { at?: [number, number, number] }) {
  const texture = useSoftTexture();
  const plumes = useRef<Array<Mesh | null>>([]);
  const dust = useRef<Group | null>(null);
  const motes = useRef<Points | null>(null);

  const positions = useMemo(() => {
    const rng = createRng(seedFrom("camp-air-dust"));
    const count = 60;
    const array = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      array[i * 3] = rng.range(-5, 5);
      array[i * 3 + 1] = rng.range(0.2, 3.4);
      array[i * 3 + 2] = rng.range(-2, 4);
    }
    return array;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    PLUMES.forEach((plume, i) => {
      const mesh = plumes.current[i];
      if (!mesh) return;

      /* Progress through this plume's own cycle, 0..1. */
      const p = (((t + plume.delay) % plume.period) / plume.period);

      mesh.position.y = 0.35 + p * 3.1;
      mesh.position.x = at[0] + plume.x + Math.sin(t * 0.28 + i) * 0.12 * p;
      const spread = 0.36 + p * 0.72;
      mesh.scale.set(spread, 1.1 + p * 1.5, 1);

      /* In by a fifth, out by the top — the 2D keyframes' 22% fade-in, which
         is what stops a plume appearing from nothing at the log. */
      const material = mesh.material as { opacity: number };
      material.opacity = 0.16 * Math.min(1, p / 0.2) * (1 - p) ** 1.4;
    });

    if (dust.current) {
      dust.current.rotation.y = t * 0.014;
      dust.current.position.y = Math.sin(t * 0.11) * 0.09;
    }
    void motes;
  });

  if (!texture) return null;

  return (
    <group>
      <group position={[at[0], at[1], at[2]]}>
        {PLUMES.map((_, i) => (
          <mesh
            key={`plume-${i}`}
            ref={(node) => {
              plumes.current[i] = node;
            }}
          >
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial
              map={texture}
              color={scene.depth[0]}
              transparent
              opacity={0}
              depthWrite={false}
              fog
            />
          </mesh>
        ))}
      </group>

      <group ref={dust}>
        <points ref={motes}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          </bufferGeometry>
          {/* Additive, so a speck in front of the fire brightens rather than
              punching a grey hole in it. */}
          <pointsMaterial
            size={0.028}
            sizeAttenuation
            color={fire.core}
            transparent
            opacity={0.42}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      </group>
    </group>
  );
}
