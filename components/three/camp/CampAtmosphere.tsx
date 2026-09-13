"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, type Mesh } from "three";
import { FIRE } from "./layout";
import { sky, smoke } from "./palette";

/**
 * Smoke off the fire, and the air between here and the mountains.
 *
 * §12 asks for continuous movement and then immediately asks for it to be
 * cheap. Both plumes and haze here are the same three planes-and-a-gradient
 * trick the illustrated camp and the Phase 5 vista already use, for the same
 * reason: three plumes read as smoke, and a thousand particles read as a demo
 * that has discovered particles.
 *
 * The cycle is the drawn camp's own — a 15-second rise with siblings at 1.27
 * and 1.53 of it, offset so the three never leave the ground together, and a
 * fade-in over the first fifth so a plume does not appear out of nothing at
 * the log. Those numbers are --smoke-rise and the CampArt keyframes. Change
 * one and the two camps stop breathing at the same rate.
 */

const PLUMES = [
  { period: 15, delay: 0, x: -0.05 },
  { period: 15 * 1.27, delay: 3, x: 0.06 },
  { period: 15 * 1.53, delay: 7, x: 0.01 },
] as const;

/** A soft round blob, generated. Stretched by the mesh, one blob is a plume. */
function useSoftTexture(): CanvasTexture | null {
  const texture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(0.45, "rgba(255,255,255,0.26)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    return new CanvasTexture(canvas);
  }, []);

  /* Made outside the R3F tree, so it is ours to release. */
  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

export function CampAtmosphere() {
  const texture = useSoftTexture();
  const plumes = useRef<Array<Mesh | null>>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    PLUMES.forEach((plume, i) => {
      const mesh = plumes.current[i];
      if (!mesh) return;

      const p = ((t + plume.delay) % plume.period) / plume.period;

      mesh.position.y = 0.4 + p * 3.4;
      mesh.position.x = plume.x + Math.sin(t * 0.26 + i) * 0.16 * p;
      /* Widening as it climbs, which is the whole of what smoke does at this
         distance — a plume that stays the same width reads as a rope. */
      mesh.scale.set(0.32 + p * 0.85, 1.1 + p * 1.7, 1);

      const material = mesh.material as { opacity: number };
      material.opacity = 0.34 * Math.min(1, p / 0.2) * (1 - p) ** 1.5;
    });
  });

  if (!texture) return null;

  return (
    <group>
      <group position={[FIRE[0], 0, FIRE[2]]}>
        {PLUMES.map((_, i) => (
          <mesh
            key={`plume-${i}`}
            ref={(node) => {
              plumes.current[i] = node;
            }}
          >
            <planeGeometry args={[1, 1]} />
            {/*
              Normal blending, not additive. Smoke occludes what is behind it;
              additive would make it glow, which is what a fire's light does
              and what its smoke does not. Slightly lighter than the sky, so
              it reads against the dark rather than as a hole in it.
            */}
            <meshBasicMaterial
              map={texture}
              color={smoke}
              transparent
              opacity={0}
              depthWrite={false}
              fog={false}
            />
          </mesh>
        ))}
      </group>

      {/*
        The air between the bands.

        Fog already thins the distance, but fog is uniform and real haze
        collects low — thickest just above the ground, thinning upward. Three
        wide, very faint planes standing in front of the far country do what
        fog cannot: they put something *between* the ridges rather than
        fading all of them equally.

        Static. Haze that visibly moves is weather, and this is meant to be
        the reason the far ridge is paler than the near one.
      */}
      {[
        { z: -30, y: 2.2, h: 7, o: 0.1 },
        { z: -20, y: 1.6, h: 5.5, o: 0.085 },
        { z: -13.5, y: 1.1, h: 4, o: 0.07 },
      ].map((band, i) => (
        <mesh key={`haze-${i}`} position={[0, band.y, band.z]}>
          <planeGeometry args={[150, band.h]} />
          <meshBasicMaterial
            map={texture}
            color={sky.haze}
            transparent
            opacity={band.o}
            depthWrite={false}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  );
}
