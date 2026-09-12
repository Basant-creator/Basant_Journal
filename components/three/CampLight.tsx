"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { PointLight } from "three";
import { fire, light } from "./palette";

interface CampLightProps {
  /** Where the fire sits, in world units. */
  at?: [number, number, number];
  /** Scenes without a fire still want the dusk. */
  flame?: boolean;
}

/**
 * Dusk, and one fire.
 *
 * Three lights, and the restraint is the design rather than a budget:
 *
 *   **No shadow maps.** They are the single most expensive thing a scene like
 *   this can switch on, and at dusk they buy almost nothing — there is no sun
 *   to cast a hard edge, and the fire's own contact shadow is drawn into the
 *   ground material instead. A shadow map here would cost a second render pass
 *   of the whole scene, every frame, to darken ground that is already dark.
 *
 *   **The key light is behind the ridges.** It is the light that has already
 *   gone: low, warm, and aimed across the scene rather than down onto it, so
 *   the silhouettes read as silhouettes. A key light in front would flatten
 *   the depth bands into one lit plane, which is exactly what the 2D scene
 *   spends three haze washes avoiding.
 *
 *   **The fill is cool.** Warm light and warm fill is a sunset poster; warm
 *   light against a cool sky is evening. It is the same decision THE SCENE's
 *   depth tokens make when they run blue-grey into the distance.
 *
 * The flicker is two sine waves at unrelated frequencies, which is the cheapest
 * way to make a loop stop sounding like one — the same trick, and the same
 * reasoning, as the 2D fire in CampArt.
 */
export function CampLight({ at = [0, 0.55, 1.2], flame = true }: CampLightProps) {
  const flare = useRef<PointLight | null>(null);

  useFrame((state) => {
    if (!flare.current) return;
    const t = state.clock.elapsedTime;
    flare.current.intensity = 9 + Math.sin(t * 2.7) * 1.6 + Math.sin(t * 6.1) * 0.7;
  });

  return (
    <>
      <ambientLight intensity={0.85} color={light.fill} />
      <directionalLight position={[-6, 3.4, -9]} intensity={1.5} color={light.key} />
      {/* The ground throwing a little back up, so nothing is pure black. */}
      <hemisphereLight args={[light.fill, light.bounce, 0.35]} />
      {flame ? (
        <pointLight
          ref={flare}
          position={at}
          intensity={9}
          distance={14}
          decay={2}
          color={fire.core}
        />
      ) : null}
    </>
  );
}
