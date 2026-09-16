"use client";

import { useMemo } from "react";
import { HERD_BY_TIER, herd } from "@/lib/world/frontier";
import { CameraRig } from "../CameraRig";
import { SceneCanvas } from "../SceneCanvas";
import { Terrain } from "../Terrain";
import { HorseHerd3D } from "../landing/HorseHerd3D";
import { light, scene } from "../palette";
import type { SceneProps } from "../types";

/**
 * The living frontier, rendered.
 *
 * The landing's landscape already exists as a drawing — three tonal bands, a
 * trail, smoke, dust — and it is what every visitor sees first and what most
 * of them keep. This is the same composition with one thing the drawing could
 * not have: horses that actually gallop.
 *
 * That is the whole justification for a renderer on the first page. §25 says
 * the landing must be lighter than the Camp, and it is — the model is 314 kB
 * against the Camp's 665 kB of props, it carries no textures at all, and it
 * arrives only after the capability check has passed and the browser has gone
 * idle. A visitor who never gets there keeps the drawing, which is complete.
 *
 * No rider: horses only, as asked.
 */
function Rig({ tier }: { tier: keyof typeof HERD_BY_TIER }) {
  /* §26: the tier decides how many run. Sliced from the front of the config,
     so a lower tier gets the leaders rather than the stragglers. */
  const horses = useMemo(() => herd.slice(0, HERD_BY_TIER[tier]), [tier]);

  return (
    <>
      {/*
        A landscape camera, not a game camera (§13).

        Low and level, looking across the ground rather than down at it, with
        a sway small enough that the viewer reads it as standing still while
        the country breathes. The lambda is slow: a camera that answers the
        pointer quickly feels like an input, and this one should feel like air.
      */}
      <CameraRig
        /* Low and well back: the herd crosses the middle distance and the
           horizon sits high enough to leave the lower frame as ground and the
           upper as sky, which is where the wordmark goes. */
        home={[0, 3.4, 24]}
        target={[0, 1.4, -22]}
        sway={[0.5, 0.2]}
        lambda={1.4}
      />

      {/*
        Golden hour, held back (§15, §17).

        One low key from the left where the sky is warmest, a cool fill for
        everything it does not reach, and a hemisphere to keep the ground from
        going black. Three lights: §25's budget, and enough for silhouettes.
      */}
      <ambientLight intensity={0.55} color={light.fill} />
      <directionalLight
        position={[-14, 4, -6]}
        intensity={1.5}
        color={light.key}
      />
      <hemisphereLight args={[scene.depth[0], light.bounce, 0.4]} />

      <Terrain heightScale={0.5} />

      <HorseHerd3D horses={horses} />
    </>
  );
}

export function LandingWorld({ tier }: SceneProps) {
  const level = (tier ?? "high") as keyof typeof HERD_BY_TIER;
  return (
    <SceneCanvas>
      <Rig tier={level in HERD_BY_TIER ? level : "high"} />
    </SceneCanvas>
  );
}
