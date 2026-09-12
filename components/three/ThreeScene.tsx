"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { type SceneCapability, detectSceneCapability } from "@/lib/three/capability";
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
} as const;

export type SceneName = keyof typeof SCENES;

interface ThreeSceneProps {
  scene: SceneName;
  /**
   * Shown when WebGL is missing, the viewport is compact, or the visitor asked
   * for reduced motion. Required, not optional — a 3D layer without a
   * fallback is a 3D layer that can take the page down with it.
   */
  fallback: ReactNode;
  /** Described to assistive technology; the canvas itself says nothing. */
  label: string;
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

  useEffect(() => {
    setCapability(detectSceneCapability());

    // A visitor who turns reduced motion on mid-visit gets taken at their word.
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const size = window.matchMedia("(max-width: 860px)");
    const recheck = () => setCapability(detectSceneCapability());

    motion.addEventListener("change", recheck);
    size.addEventListener("change", recheck);
    return () => {
      motion.removeEventListener("change", recheck);
      size.removeEventListener("change", recheck);
    };
  }, []);

  if (capability !== "ready") {
    return (
      <div className={className} data-scene-mode={capability}>
        {fallback}
      </div>
    );
  }

  const Scene = SCENES[scene];

  return (
    <div className={[styles.stage, className].filter(Boolean).join(" ")} data-scene-mode="ready">
      <div className={styles.canvas} role="img" aria-label={label}>
        {/* The handler goes last so a caller cannot replace it. */}
        <Scene {...state} onContextLost={handleContextLost} />
      </div>
      {/* The DOM layer over the canvas: labels, controls, records. The canvas
          carries atmosphere; everything readable stays here. */}
      {children}
    </div>
  );
}
