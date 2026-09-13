"use client";

import { light } from "./palette";

/**
 * Blue hour, lit for a camera.
 *
 * §6 asks for five roles and the scene had three. The two that were missing
 * are the two that make a frame read as photographed rather than as lit:
 * something to separate a foreground silhouette from the country behind it,
 * and shadows where the eye is actually looking.
 *
 * The arrangement is still the one §5 hangs the art direction on — a cool
 * world and a warm camp — and the discipline that protects it is that every
 * source here is cold. The fire and the lantern are the only warm light in
 * the scene, and they are the only warm light because everything else
 * deliberately refuses to be. A warm key would spend the contrast before the
 * fire is lit.
 *
 *   base        a cool hemisphere: enormous soft sky above, dark ground below
 *   key         what is left of the sun, low and raking from behind the ridges
 *   rim         a colder, lower, lateral source that finds the near edges
 *   ambient     barely anything, so that nothing is a hole in the picture
 *
 * The key and the rim are both behind the subject, and that is not a
 * duplication — they are at different heights, from different sides, at
 * different temperatures. The key models the land. The rim exists for one
 * job: to put a cold line along the top of the table, the chair and the
 * tent so they do not merge into the treeline. §6 calls it separation and
 * that is exactly what it is; it lights edges, not faces.
 */
export function CampLighting() {
  return (
    <>
      {/* Sky above, ground below. The ratio is the scene's real light. */}
      <hemisphereLight args={[light.sky, light.bounce, 1.05]} />

      {/*
        The last of the sun, raking from behind the ridges rather than down
        onto the camp. A key in front would flatten the depth bands into one
        lit plane — the exact thing the illustrated scene spends three haze
        washes avoiding.
      */}
      <directionalLight position={[-14, 4.5, -26]} intensity={0.55} color={light.key} />

      {/*
        Separation. Low, lateral, and the coldest thing in the scene, so an
        edge it catches reads as sky rather than as a second sun. Weak on
        purpose: at this strength it is invisible as a light and only visible
        as the fact that the foreground is no longer stuck to the background.
      */}
      <directionalLight position={[9.5, 1.8, -11]} intensity={0.26} color={light.rim} />

      {/* Barely anything. Enough that nothing is pure black, which at blue
          hour is the difference between shadow and a hole in the picture. */}
      <ambientLight intensity={0.2} color={light.sky} />
    </>
  );
}
