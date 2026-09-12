"use client";

import { useEffect, useRef, useState } from "react";
import { useSceneInteraction } from "@/components/scene/SceneContext";
import { ThreeScene } from "@/components/three/ThreeScene";
import { CampArt } from "./CampArt";
import styles from "./CampStage.module.css";

/**
 * Camp's picture, by whichever means the visitor can have it.
 *
 * This is the bridge, and it runs in one direction each way:
 *
 *   **In**: the tablist's selection and hover go to the renderer as plain
 *   props. R3F renders into its own reconciler root, so the context this
 *   component is sitting in does not reach inside the canvas by itself — and
 *   bridging it would be a dependency to carry for four strings.
 *
 *   **Out**: the renderer projects each object's position onto the Scene's
 *   stage element as custom properties, and the hit areas over the canvas read
 *   them with the illustrated box as the fallback value. Nobody writes those
 *   properties unless a canvas is mounted and projecting, so the 2D layout is
 *   what applies everywhere else — which is also why the controls keep working
 *   in the frames before the chunk has loaded.
 *
 * The illustrated camp is the fallback and not a lesser version of this. It is
 * the drawing the whole site is made of; the renderer is what a machine with
 * the spare capacity gets shown instead.
 */
export function CampStage() {
  const host = useRef<HTMLDivElement | null>(null);
  const stage = useRef<HTMLElement | null>(null);
  const [, setReady] = useState(false);
  const interaction = useSceneInteraction();

  useEffect(() => {
    stage.current = host.current?.closest<HTMLElement>("[data-scene-stage]") ?? null;
    // One render so the ref is populated before the scene reads it.
    setReady(true);
  }, []);

  return (
    <div ref={host} className={styles.render}>
      <ThreeScene
        scene="camp"
        className={styles.layer}
        /* The place, not its contents. "Objects on the table" follows
           immediately and names all four interactively, so listing them here
           means hearing them twice before reaching one. */
        label="Camp at dusk: a low fire in front of a tent, with the ridges of the surveyed territory behind it."
        fallback={<CampArt />}
        state={{
          activeId: interaction?.activeId ?? null,
          hoverId: interaction?.hoverId ?? null,
          anchorTarget: stage,
        }}
      />
    </div>
  );
}
