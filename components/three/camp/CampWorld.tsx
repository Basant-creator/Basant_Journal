"use client";

import { SceneCanvas } from "../SceneCanvas";
import { scene } from "../palette";
import type { SceneProps } from "../types";
import { CAMERA_FOV, CAMERA_HOME, GROUND_Y } from "./layout";

/**
 * Camp — the production scene.
 *
 * A shell. Everything it will contain arrives in the steps after this one, in
 * the order §36 sets: camera, sky and lighting, distant terrain, mountains and
 * trees, the campsite, the fire, the air, the table and its props. The slots
 * below are that order, written down, so each step has one obvious place to
 * go and the composition cannot quietly end up assembled back to front.
 *
 * It is built beside the existing Camp rather than on top of it. `/about`
 * depends on `CampScene3D`, and replacing a working scene with a half-built
 * one for a dozen steps is how a route stays broken for a week. This develops
 * on `/lab/camp` — already outside the sitemap and disallowed in robots.txt —
 * and `/about` switches to it when there is something whole to switch to.
 *
 * Nothing here knows what Camp *means*. The records behind the objects, the
 * routes they lead to and the labels over them all stay in the DOM, which is
 * the boundary's rule and the reason the illustrated scene can stand in for
 * this one without anything being reimplemented.
 */
function World(_props: SceneProps) {
  return (
    <>
      {/* 01  sky and atmosphere            — step 04 */}
      {/* 02  distant mountains             — step 06 */}
      {/* 03  distant terrain               — step 05 */}
      {/* 04  tree line                     — step 06 */}
      {/* 05  mid-ground terrain            — step 05 */}

      {/*
        The floor, which exists from the start because everything else is
        placed against it. Unlit and dark: at blue hour the ground is read
        from what stands on it and what the fire reaches, and a lit plane here
        spends a lighting pass to arrive at nearly the same black.
      */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]}>
        <planeGeometry args={[220, 220]} />
        <meshBasicMaterial color={scene.ground} fog />
      </mesh>

      {/* 06  campfire                      — step 08 */}
      {/* 07  tent                          — step 07 */}
      {/* 08  table                         — step 10 */}
      {/* 09  chair                         — step 07 */}
      {/* 10  lantern                       — step 10 */}
      {/* 11  props and papers              — steps 11-14 */}
      {/* 12  foreground grass and rocks    — step 07 */}
      {/* 13  atmospheric effects           — step 09 */}
    </>
  );
}

export function CampWorld(props: SceneProps) {
  return (
    <SceneCanvas
      background={scene.night}
      /* Blue hour: the far bands should already be losing themselves before
         the near ones do. Tuned properly once the terrain exists. */
      fog={{ color: scene.night, near: 14, far: 74 }}
      camera={{ position: CAMERA_HOME, fov: CAMERA_FOV }}
      onContextLost={props.onContextLost}
    >
      <World {...props} />
    </SceneCanvas>
  );
}
