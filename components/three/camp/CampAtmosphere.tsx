"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, type Mesh } from "three";
import { FIRE } from "./layout";
import { sky, smoke } from "./palette";
import { WIND_X, breeze, gust } from "./wind";

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

/**
 * A puff, generated.
 *
 * It was a plain radial gradient — a perfectly round soft disc, which is
 * exactly what smoke is not. A circle is the one shape that survives being
 * scaled, rotated and faded without ever looking like anything else, so three
 * of them rising in a line read as three circles rising in a line.
 *
 * This is still a radial falloff, because that is what keeps the edges soft
 * and the centre dense. What is added is turbulence: the radius at which the
 * falloff happens now varies with angle and with distance, so the outline is
 * ragged and the interior is uneven. At this size nobody sees the detail.
 * What they see is that the shape is not a circle.
 *
 * White, throughout. The colour comes from the material — one texture serves
 * both the plumes and the haze bands, and they are not the same colour.
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

    const frame = ctx.createImageData(size, size);
    const px = frame.data;
    const mid = size / 2;

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = (x - mid) / mid;
        const dy = (y - mid) / mid;
        const r = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        /* The edge wanders. Three harmonics so it is irregular rather than
           merely lobed — two would read as a peanut. */
        const wobble =
          0.12 * Math.sin(angle * 3 + 0.7) +
          0.07 * Math.sin(angle * 5 - 1.4) +
          0.05 * Math.sin(angle * 8 + 2.9);

        /* And the inside is uneven, in a way that has nothing to do with the
           edge — smoke is thicker in some places than others. */
        const grain =
          0.1 * Math.sin(dx * 7.3 + 1.1) * Math.sin(dy * 6.1 - 0.4) +
          0.06 * Math.sin(dx * 12.7 - 2.2) * Math.sin(dy * 11.3 + 1.8);

        const edge = 1 + wobble;
        const falloff = Math.max(0, 1 - r / edge);
        const a = Math.max(0, Math.min(1, Math.pow(falloff, 1.6) * 0.9 + grain * falloff));

        const i = (y * size + x) * 4;
        px[i] = 255;
        px[i + 1] = 255;
        px[i + 2] = 255;
        px[i + 3] = a * 255;
      }
    }

    ctx.putImageData(frame, 0, 0);
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

      /*
        Downwind, and further downwind the higher it gets.

        The lean goes with p squared rather than p, which is wind shear: air
        near the ground is slowed by everything it is dragging over, and air
        three metres up is not. It also happens to be what makes a plume read
        as a plume — leaning from the base looks like the fire is tilted.

        The gust is on top and signed, so the column wanders across the line
        it is travelling rather than following it exactly.
      */
      const lean = WIND_X * breeze(t) * p * p * 1.15;
      mesh.position.x = plume.x + lean + gust(t, i * 2.1) * 0.14 * p;

      /* Widening as it climbs, which is the whole of what smoke does at this
         distance — a plume that stays the same width reads as a rope. */
      mesh.scale.set(0.32 + p * 0.85, 1.1 + p * 1.7, 1);

      /* Turning, slowly and each at its own rate. Three identical puffs
         rising in a line is the giveaway that they are one sprite; three
         turning at different rates is not. */
      mesh.rotation.z = (i * 1.1 + t * (0.06 + i * 0.017)) % (Math.PI * 2);

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
