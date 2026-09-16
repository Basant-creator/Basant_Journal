"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useTransition } from "@/components/transition/TransitionContext";
import {
  type SceneCapability,
  type SceneReason,
  detectSceneCapability,
  sceneCapabilityReason,
} from "@/lib/three/capability";
import { markScene } from "@/lib/three/profile";
import { type QualityTier, detectQualityTier } from "@/lib/three/quality";
import type { SceneProps } from "./types";
import styles from "./ThreeScene.module.css";

/**
 * Scene chunks, keyed by name.
 *
 * Every entry is behind `next/dynamic` with `ssr: false`, so three never
 * enters the server build and never enters the shared client bundle — it
 * arrives as its own chunk, only when a scene that needs it is actually
 * mounted. Adding a scene means adding a line here and nothing else.
 */
const SCENES = {
  /** Step 03's bench: the smallest thing that proves the boundary holds. */
  bench: dynamic(() => import("./scenes/BenchScene").then((m) => m.BenchScene), {
    ssr: false,
  }),
  /** Camp: the same place the illustrated scene draws, rendered. */
  camp: dynamic(() => import("./scenes/CampScene3D").then((m) => m.CampScene3D), {
    ssr: false,
  }),
  /** The country behind the survey sheet. Scenery, and only scenery. */
  vista: dynamic(() => import("./scenes/VistaScene").then((m) => m.VistaScene), {
    ssr: false,
  }),
  /** Camp, in production. Built beside the prototype until it replaces it. */
  campWorld: dynamic(() => import("./camp/CampWorld").then((m) => m.CampWorld), {
    ssr: false,
  }),
  /** The landing's country, with the herd crossing it. */
  landing: dynamic(
    () => import("./scenes/LandingWorld").then((m) => m.LandingWorld),
    { ssr: false },
  ),
} as const;

export type SceneName = keyof typeof SCENES;

interface ThreeSceneProps {
  scene: SceneName;
  /**
   * Shown when WebGL is missing, the viewport is compact, or the visitor asked
   * for reduced motion. Required, not optional — a 3D layer without a
   * fallback is a 3D layer that can take the page down with it.
   *
   * It is a picture and nothing else. Both branches put it inside an
   * element with role="img", which makes it a leaf in the accessibility
   * tree — anything interactive placed here would be announced as part of
   * an image label and could not be reached. Controls belong in children,
   * which is why children now render in both branches and not only when a
   * renderer happens to be available.
   */
  fallback: ReactNode;
  /**
   * Described to assistive technology, in both renderings.
   *
   * It says what the picture is, not what is in it: the objects on the
   * table are named by the controls over the scene, and a label that
   * enumerates them too means hearing the same list twice before reaching
   * anything usable.
   *
   * `null` means the scene is scenery rather than a picture — the country
   * behind the survey sheet, say, where the sheet itself is already a
   * described navigation region. It is then hidden from the accessibility
   * tree entirely, because announcing "ridges at dusk" in front of a map
   * someone is trying to use is noise, not description. Null is a decision,
   * not a default: the type will not let it be forgotten.
   */
  label: string | null;
  className?: string;
  children?: ReactNode;
  /**
   * What the DOM wants the scene to do — a selection, a hover, somewhere to
   * write projected positions. Plain data, checked by SceneProps, so the
   * door can carry the payload without a 3D type entering its signature.
   */
  state?: SceneProps;
}

/**
 * The only door through the 3D boundary.
 *
 * Its signature has no 3D types in it on purpose: a caller asks for a scene by
 * name and supplies what to show instead, and never touches a renderer. That
 * is what keeps `three` on one side of the wall and the portfolio on the
 * other.
 *
 * Capability is resolved on the client after mount, so the server always
 * renders the fallback. The first paint is therefore the 2D scene in every
 * case — which means a visitor whose WebGL fails never sees a broken canvas,
 * they see the illustrated version and nothing else happens.
 */
export function ThreeScene({
  scene,
  fallback,
  label,
  className,
  children,
  state,
}: ThreeSceneProps) {
  const [capability, setCapability] = useState<SceneCapability>("pending");
  /* Why, for whoever is debugging it. Never shown to a visitor. */
  const [reason, setReason] = useState<SceneReason | null>(null);
  /* Probed once, next to the capability check, and for the same reason: it
     costs a throwaway context and it decides how much the expensive side is
     allowed to do. Null until the client has answered — the server has no
     GPU to ask. */
  const [tier, setTier] = useState<QualityTier | null>(null);

  /*
    A lost context is a fallback, immediately and for the rest of the visit.

    Contexts are lost under pressure — too many alive, a driver reset, a
    backgrounded GPU — and none of those get better by trying again a moment
    later. Without this the canvas simply stopped updating and stayed on
    screen: a still, wrong frame where a drawing should be, which is precisely
    the failure this component's own fallback contract exists to prevent.
  */
  const handleContextLost = useCallback(() => {
    setCapability("unsupported");
  }, []);

  /*
    The scene mounts after the page has landed, not during.

    Measured on a click into Camp: the renderer's chunk starts arriving
    167ms in and the long tasks that parse and initialise it land at 545ms
    and 680ms — which is exactly when the chapter card, the page entry and
    the scene's own settle are playing. The one moment the site is asking
    to be watched is the moment it was spending 177ms of main thread on
    something nobody can see yet.

    requestIdleCallback alone did not achieve that, and §19 is where it
    showed. Measured again with a chapter in the way: the route changes at
    180ms, the chapter card comes up at 536ms, idle fires at 536ms too, the
    canvas paints its first frame at 643ms — and the card does not clear
    until 1568ms. A camera arrival of 1900ms is therefore 96% finished
    before anybody can see the scene it is arriving into. The arrival was
    not too slow or too fast; it was playing behind a curtain.

    So the wait is on the curtain, not on a guess about the main thread.
    IDLE is the only phase in which nothing is covering the page, and every
    path through the transition ends there — including the 2600ms guard, so
    a transition that somehow stalls cannot strand the scene. A route with
    no chapter at all is IDLE from the start and mounts as it always did.

    Waiting costs nothing, because the fallback is not a placeholder: the
    illustrated camp is already on screen and complete. This only decides
    when it is replaced.

    requestIdleCallback with a timeout, so a busy main thread still gets
    the scene rather than never getting it; a plain timer where the API is
    missing.
  */
  const transition = useTransition();
  const covered = transition !== null && transition.phase !== "IDLE";

  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (capability !== "ready" || covered) return;

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setSettled(true), { timeout: 1400 });
      return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(() => setSettled(true), 700);
    return () => window.clearTimeout(id);
  }, [capability, covered]);

  /*
    The starting gun for §38's two timings.

    In an effect and not in the render body: marking "request" clears the two
    marks after it, and ThreeScene re-renders for reasons that have nothing to
    do with mounting a scene — a transition phase changing, a tier arriving.
    Done during render, every one of those would wipe the numbers a moment
    after they were taken and the overlay would show blanks that look like a
    scene that never loaded.

    It runs one commit after `next/dynamic` is first asked for the chunk,
    which is close enough to the fetch to be the fetch, and is the earliest
    moment that is *reliably* once per visit. Development only.
  */
  const mounting = capability === "ready" && settled;
  useEffect(() => {
    if (mounting) markScene("request");
  }, [mounting]);

  /* Described or hidden — the two honest options for a box with a picture
     in it. Shared by both branches so they cannot drift apart. */
  const pictureRole = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": true } as const);

  useEffect(() => {
    setCapability(detectSceneCapability());
    setReason(sceneCapabilityReason());
    setTier(detectQualityTier());

    // A visitor who turns reduced motion on mid-visit gets taken at their word.
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const size = window.matchMedia("(max-width: 860px)");
    const recheck = () => {
      setCapability(detectSceneCapability());
      setReason(sceneCapabilityReason());
    };

    motion.addEventListener("change", recheck);
    size.addEventListener("change", recheck);
    return () => {
      motion.removeEventListener("change", recheck);
      size.removeEventListener("change", recheck);
    };
  }, []);

  /* Not ready, or ready and still letting the page arrive: either way the
     illustrated scene is what is on screen, and it is the same scene. */
  if (capability !== "ready" || !settled) {
    return (
      <div
        className={[styles.stage, className].filter(Boolean).join(" ")}
        data-scene-mode={capability}
        data-scene-reason={reason ?? undefined}
      >
        <div className={styles.picture} {...pictureRole}>
          {fallback}
        </div>
        {children}
      </div>
    );
  }

  const Scene = SCENES[scene];

  return (
    <div className={[styles.stage, className].filter(Boolean).join(" ")} data-scene-mode="ready">
      <div className={`${styles.picture} ${styles.arrives}`} {...pictureRole}>
        {/* The handler goes last so a caller cannot replace it. */}
        <Scene {...state} tier={tier ?? "medium"} onContextLost={handleContextLost} />
      </div>
      {/* The DOM layer over the canvas: labels, controls, records. The canvas
          carries atmosphere; everything readable stays here. */}
      {children}
    </div>
  );
}
