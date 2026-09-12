"use client";

import { light } from "./palette";

/**
 * Blue hour, lit.
 *
 * Three sources and no shadow maps. The omission is deliberate and it is not a
 * budget: at this hour there is no sun left to cast a hard edge, and a shadow
 * map would spend a second full render pass every frame to darken ground that
 * the sky is already failing to light. What reads as "long shadows" in §6 is
 * the absence of fill on the far side of things, which a low key and a
 * directional hemisphere give for free.
 *
 * The hemisphere does most of the work, because at blue hour it should: an
 * open sky is an enormous soft source, and the ground under it is a dark one.
 * That difference — light from above, nothing from below — is most of what
 * makes an outdoor scene read as outdoors.
 *
 * The key is what is left of the sun: low, behind the ridges, and cool. Not
 * golden. §5 hangs the whole art direction on the contrast between a cool
 * environment and a warm fire, and a warm key would spend that contrast before
 * the fire is even lit. The fire's own light arrives at step 08 and will be
 * the only warm source in the scene.
 */
export function CampLighting() {
  return (
    <>
      {/* Sky above, ground below. The ratio is the scene's real light. */}
      <hemisphereLight args={[light.sky, light.bounce, 1.15]} />

      {/*
        The last of the sun, raking from behind the ridges rather than down
        onto the camp. A key in front would flatten the depth bands into one
        lit plane — the exact thing the illustrated scene spends three haze
        washes avoiding.
      */}
      <directionalLight position={[-14, 4.5, -26]} intensity={0.62} color={light.key} />

      {/* Barely anything. Enough that nothing is pure black, which at blue
          hour is the difference between shadow and a hole in the picture. */}
      <ambientLight intensity={0.22} color={light.sky} />
    </>
  );
}
