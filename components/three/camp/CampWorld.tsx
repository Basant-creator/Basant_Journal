"use client";

import { CameraRig } from "../CameraRig";
import { ObjectAnchors } from "../ObjectAnchors";
import { CampAtmosphere } from "./CampAtmosphere";
import { CampFire } from "./CampFire";
import { CampGround } from "./CampGround";
import { CampLighting } from "./CampLighting";
import { CampSky } from "./CampSky";
import { CampMountains } from "./CampMountains";
import { CampObjects } from "./CampObjects";
import { CampProps } from "./CampProps";
import { CampScatter } from "./CampScatter";
import { CampSite } from "./CampSite";
import { CampTable } from "./CampTable";
import { CampTerrain } from "./CampTerrain";
import { CampTreeline } from "./CampTreeline";
import { SceneCanvas } from "../SceneCanvas";
import { sky } from "./palette";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Group, Mesh } from "three";
import { settingsFor } from "@/lib/three/quality";
import type { SceneProps } from "../types";
import {
  CAMERA_ARRIVAL,
  CAMERA_BOUNDS,
  CAMERA_FOV,
  CAMERA_HOME,
  CAMERA_TARGET,
  ANCHORS,
  ANCHOR_WIDTHS,
  type CampObject,
} from "./layout";

/**
 * Camp.
 *
 * The composition is assembled far to near, in §36's order: camera, sky and
 * lighting, distant terrain, mountains and trees, the campsite, the fire, the
 * air, the table and its props. The slots below are that order written down,
 * so each piece has one obvious place to go and the scene cannot quietly end
 * up built back to front.
 *
 * It was developed on `/lab/camp` beside a working prototype, and that
 * prototype — `scenes/CampScene3D`, with its own `CampAir` and `CampLight` —
 * is gone. It had been unreferenced since `/about` switched over: registered
 * in ThreeScene's scene table, reachable by nobody, and quietly collecting
 * edits meant for this file. Two hundred and fifty lines of 3D that nothing
 * could render is the most expensive kind of dead code, because it looks
 * exactly like the live kind.
 *
 * Nothing here knows what Camp *means*. The records behind the objects, the
 * routes they lead to and the labels over them all stay in the DOM, which is
 * the boundary's rule and the reason the illustrated scene can stand in for
 * this one without anything being reimplemented.
 */
function World(props: SceneProps) {
  /*
    How much of this to draw.

    §31 asks for tiers that change density and cost and never composition —
    so the settings reach the things that can be counted (embers, grass,
    stones, trees) and nothing that decides where anything is. A visitor on a
    weaker machine is looking at the same camp from the same place; there is
    simply less of the gravel.
  */
  const q = settingsFor(props.tier ?? "medium");
  const shadows = { enabled: q.shadows, mapSize: q.shadowMapSize };

  /*
    The establish, and the reason the lean waits for it.

    The notebook is the tablist's initial selection — it has to be, because
    the record panel below the canvas must not open empty — so a camera that
    honours `activeId` from the first frame resolves its whole arrival *into a
    lean at the notebook*. The place is never once on screen without something
    being pointed at, which is the one thing an arrival is for.

    A plain timer rather than a frame count, because it is not synchronised to
    the arrival: CameraRig seeds its own clock on the first drawn frame, which
    can be later than this component mounting — the scene is deferred to idle.
    The failure that matters is the hold ending early, so it runs past
    CAMERA_ARRIVAL.ms by a margin that costs nothing and cannot expose it.
  */
  const [attending, setAttending] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setAttending(true), CAMERA_ARRIVAL.ms + 300);
    return () => window.clearTimeout(id);
  }, []);

  /*
    What the camera leans toward, if anything is open.

    This was computed and then not used — declared, commented, and passed to
    nothing, so the camera never acknowledged the object being reached for.
    It is wired now, and the two numbers around it are the interesting part.

    `pull` is 0.16 because 0.5 was measured on the prototype and was a dive:
    the camera travelled far enough onto the chosen object to throw the other
    three out of frame, at 166% and 280% across the viewport. §3 wants one
    primary focus, not one object; a lean says which of four is being attended
    to and keeps the other three in the picture.

    And CAMERA_BOUNDS still applies, which is the safety net that makes this
    cheap. CameraRig clamps the *desired* position rather than the camera's
    own, so the lean is absorbed by the same box that limits leaning — about
    a hundred millimetres across and a hundred and thirty down. It cannot take
    anyone past the edge of what has been built, whatever is selected.
  */
  const activeFocus =
    attending && props.activeId && props.activeId in ANCHORS
      ? ANCHORS[props.activeId as CampObject]
      : null;

  /*
    Which things are allowed to cast and catch shadows.

    §28 is a list rather than a switch: the campfire area, the table, the
    tent, the hero props, the foreground. Everything past that — ridges,
    terrain bands, the tree stand, the haze — is lit and never shadowed,
    because at this distance a shadow map has nothing to add and a great deal
    to cost.

    So the near field is a group, and the group is the list. Walking it once
    on layout is cheaper and far harder to get wrong than three dozen
    castShadow props spread across six files, and it keeps the policy in one
    readable place.

    Basic materials are skipped. Flames, embers and the map's route overlay
    are light rather than matter; a flame that casts a shadow is a solid
    orange cone, which is the exact failure §7 warns about.
  */
  const near = useRef<Group | null>(null);
  useLayoutEffect(() => {
    const root = near.current;
    if (!root) return;
    root.traverse((node) => {
      const mesh = node as Mesh;
      if (!mesh.isMesh) return;
      const material = mesh.material;
      const basic = Array.isArray(material)
        ? material.some((m) => m.type === "MeshBasicMaterial")
        : material?.type === "MeshBasicMaterial";
      if (basic) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
  }, [q.shadows]);

  return (
    <>
      {/*
        The camera, first, because every number below is chosen against
        what it can see. It arrives once and then only leans: §9 asks for
        someone looking around, not someone playing, and CameraRig has
        refused to orbit since it was written.
      */}
      <CameraRig
        home={CAMERA_HOME}
        target={CAMERA_TARGET}
        arrival={CAMERA_ARRIVAL}
        bounds={CAMERA_BOUNDS}
        focus={activeFocus}
        pull={0.16}
        /* Wider than the vista's, narrower than a game's: the whole
           travel is inside the box §10 defines, so leaning can never take
           anyone past the edge of what has been built. */
        sway={[0.46, 0.2]}
        lambda={2.1}
      />

      {/* 01  sky and atmosphere */}
      <CampSky />
      <CampLighting />

      {/* 02  distant mountains */}
      <CampMountains />

      {/* 03  distant terrain · 05  mid-ground terrain */}
      <CampTerrain />
      {/* 04  tree line */}
      <CampTreeline count={q.trees} />



      {/*
        The ground. Two layers rather than one, and the near one is displaced
        — see CampGround, and §10, which asks for exactly this split.
      */}
      <CampGround />

      {/* The near field — everything §28 spends shadows on. */}
      <group ref={near}>
        {/* 06  campfire */}
        <CampFire embers={q.embers} shadows={shadows} />

        {/* 07  tent · 09  chair */}
        <CampSite />

        {/* 08  table · 10  lantern */}
        <CampTable />

        {/*
          The supplied props, dressed in the Camp's own materials.

          Inside the near-field group deliberately: §15 spends shadows on the
          fire, the structure and the working end, and these are the objects
          that stand in that light. The ones that do not — the rails and the
          pole against the afterglow — are placed far enough out that the
          frozen shadow map never reaches them.

          Suspended rather than awaited: the scene is whole without them and
          they arrive into it. §37 asks that loading feel intentional and that
          nothing freeze waiting for a background asset, and a camp that
          appears and then fills with supplies is a better answer to that than
          a camp that will not appear until its barrels have downloaded.
        */}
        <Suspense fallback={null}>
          <CampProps tier={props.tier ?? "medium"} />
        </Suspense>
      </group>

      {/* 11  props and papers */}
      <CampObjects {...props} />
      {/* 12  foreground grass and rocks */}
      <CampScatter grass={q.grass} stones={q.stones} />
      {/* 13  atmospheric effects */}
      <CampAtmosphere />

      {/*
        And the one thing the scene tells the page back.

        Everything above reads the DOM; this writes to it — where each object
        ended up on screen, as custom properties, so the controls over the
        canvas can stand on the objects they name. It is the same seam the
        illustrated camp uses, and it is why the two can swap without the
        controls being reimplemented for either.

        Absent when nobody asked for it: a scene on a bench with no label
        layer should not be projecting four points every frame.
      */}
      {props.anchorTarget ? (
        <ObjectAnchors
          anchors={ANCHORS}
          sizes={ANCHOR_WIDTHS}
          into={props.anchorTarget}
        />
      ) : null}
    </>
  );
}

export function CampWorld(props: SceneProps) {
  const q = settingsFor(props.tier ?? "medium");
  return (
    <SceneCanvas
      dpr={q.dpr}
      shadows={{ enabled: q.shadows, mapSize: q.shadowMapSize }}
      background={sky.zenith}
      /* Blue hour: the far bands should already be losing themselves before
         the near ones do. Tuned properly once the terrain exists. */
      fog={{ color: sky.haze, near: 16, far: 96 }}
      camera={{ position: CAMERA_HOME, fov: CAMERA_FOV }}
      onContextLost={props.onContextLost}
    >
      <World {...props} />
    </SceneCanvas>
  );
}
