"use client";

import { CameraRig } from "../CameraRig";
import { SceneCanvas } from "../SceneCanvas";
import { Terrain } from "../Terrain";
import { light, scene } from "../palette";
import type { SceneProps } from "../types";

/**
 * The country the survey sheet is held against.
 *
 * Not the map. The map is the navigation — real links, arrow keys that move by
 * geography, a trail, a contract in docs/routing-contract.md promising it is
 * never the only way to reach anything — and all of that stays exactly where
 * it is, in the DOM, above this. What is rendered here is only what was
 * already scenery: the ridges behind the sheet, which the illustrated version
 * draws as flat silhouettes and which cost 20 kB of generated markup.
 *
 * That division is the boundary's own rule rather than a compromise. The
 * canvas carries atmosphere; everything readable, reachable or navigable stays
 * in the DOM. A renderer that swallowed the markers would be trading a
 * guarantee for a picture.
 *
 * Same ridges as the sheet in front of it, from `ridgeProfiles()` by way of
 * Terrain — so the country in the frame is the country being surveyed, not a
 * backdrop that resembles it.
 *
 * No fire, so no point light and no flicker: this is the hour after the sun
 * has gone, lit only by what is left in the sky.
 */
function Rig() {
  return (
    <>
      <CameraRig
        /*
          Below the nearest crest, which is the whole reason the ridges read
          as a horizon rather than as hills on a plain. Above it, a short
          ridge's top falls below eye level and the band breaks apart; the
          illustrated vista keeps every crest above the horizon line and this
          is what that costs in three dimensions.

          Pitched down 13.9 degrees, computed rather than nudged: at fov 40
          that puts the horizon 16% from the top of the frame, which is where
          SHEET_INSET.top puts it in the drawing.
        */
        home={[0, 1.2, 15]}
        target={[0, -6.9, -18]}
        /* Barely. The sheet is the thing being read; the country behind it
           should move just enough to have depth, and never enough to pull an
           eye off the map. */
        sway={[0.34, 0.16]}
        lambda={1.9}
      />

      <ambientLight intensity={0.8} color={light.fill} />
      <directionalLight position={[-8, 3, -14]} intensity={1.35} color={light.key} />
      <hemisphereLight args={[light.fill, light.bounce, 0.3]} />

      <Terrain heightScale={0.45} />
    </>
  );
}

export function VistaScene(_props: SceneProps) {
  return (
    <SceneCanvas
      background={scene.night}
      fog={{ color: scene.night, near: 18, far: 70 }}
      camera={{ position: [0, 1.2, 15], fov: 40 }}
    >
      <Rig />
    </SceneCanvas>
  );
}
