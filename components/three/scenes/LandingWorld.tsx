"use client";

import { useMemo } from "react";
import { HERD_BY_TIER, herd } from "@/lib/world/frontier";
import { CameraRig } from "../CameraRig";
import { SceneCanvas } from "../SceneCanvas";
import { HorseHerd3D } from "../landing/HorseHerd3D";
import { HourRig } from "../landing/HourRig";
import { Sky } from "../landing/Sky";
import { Territory } from "../landing/Territory";
import { hours } from "../hours";
import type { SceneProps } from "../types";

/**
 * The split frontier: one territory at two hours.
 *
 * What was here before was the shared `Terrain` — three ridge bands borrowed
 * from the vista — with a herd running across it. §2 named the problem
 * exactly: gradient bands and flat layered silhouettes read as *atmosphere*
 * rather than as a place, and nothing about them said there was country
 * beyond the screen.
 *
 * So the land is built now: a displaced floor, three folded ranges, four
 * mesas, a trail that converges toward the horizon, and sparse rock and
 * scrub. All of it low-poly and flat-shaded, and all of it arranged around
 * the wordmark rather than behind it — the far range is tall at the edges and
 * drops away in the middle so the title sits in open sky (§31).
 *
 * The thing worth understanding about this tree is what is *not* in it. There
 * is no dusk scene and no dawn scene. There is one scene, drawn once, whose
 * every material carries both hours and asks a shared boundary which one this
 * fragment wears. That is §12, and it is what makes §21 true for free: the
 * herd crossing the boundary is one herd in changing light, because it is
 * literally the same meshes and the same mixers on both sides.
 *
 * No rider. Horses only, as asked — §20 and §22 notwithstanding.
 */
function Rig({ tier }: { tier: keyof typeof HERD_BY_TIER }) {
  /* §26: the tier decides how many run. Sliced from the front of the config,
     so a lower tier gets the leaders rather than the stragglers. */
  const horses = useMemo(() => herd.slice(0, HERD_BY_TIER[tier]), [tier]);

  return (
    <>
      {/*
        A landscape camera, not a game camera (§34).

        Low and level, looking across the ground rather than down at it, with
        a sway small enough that the viewer reads it as standing still while
        the country breathes. The lambda is slow: a camera that answers the
        pointer quickly feels like an input, and this one should feel like air.
      */}
      <CameraRig
        home={[0, 3.4, 24]}
        target={[0, 1.4, -22]}
        sway={[0.5, 0.2]}
        lambda={1.4}
      />

      {/* The sky, the sun, the air, and the boundary that moves between
          hours. One component because all four share a clock. */}
      <Sky />
      <HourRig />

      <Territory />
      <HorseHerd3D horses={horses} />
    </>
  );
}

export function LandingWorld({ tier }: SceneProps) {
  const level = (tier ?? "high") as keyof typeof HERD_BY_TIER;
  return (
    <SceneCanvas
      /* The sky sphere covers the frame, so this is only ever seen for the
         frame before it draws. Dusk, to match the server's own hour. */
      background={hours.dusk.air.fog}
      fog={{
        color: hours.dusk.air.fog,
        near: hours.dusk.air.near,
        far: hours.dusk.air.far,
      }}
    >
      <Rig tier={level in HERD_BY_TIER ? level : "high"} />
    </SceneCanvas>
  );
}
