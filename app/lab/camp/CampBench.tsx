"use client";

import { useState } from "react";
import { CampArt } from "@/components/scenes/CampArt";
import { ThreeScene } from "@/components/three/ThreeScene";
import type { SceneProps } from "@/components/three/types";
import styles from "./page.module.css";

const OBJECTS = ["notebook", "map", "photograph", "notes"] as const;
type Id = (typeof OBJECTS)[number];

/**
 * The bench's hands.
 *
 * Camp's objects answer to a selection that lives in the DOM, and on the real
 * route that selection is the tablist over the canvas — which does not exist
 * until step 20. Until then this stands in for it, so each object's response
 * can be checked the moment it is built rather than four steps later when
 * everything is wired at once and a fault could be in any of it.
 *
 * Hover and selection are separate controls on purpose. They are separate
 * states in the scene, they look different, and the commonest way to ship a
 * broken one is to only ever test them together.
 */
export function CampBench() {
  const [hoverId, setHoverId] = useState<Id | null>(null);
  const [activeId, setActiveId] = useState<Id | null>(null);

  const state: SceneProps = { hoverId, activeId };

  return (
    <>
      <div className={styles.controls}>
        {OBJECTS.map((id) => (
          <div key={id} className={styles.control}>
            <span className={styles.controlName}>{id}</span>
            <button
              type="button"
              className={styles.controlButton}
              aria-pressed={hoverId === id}
              onClick={() => setHoverId(hoverId === id ? null : id)}
            >
              hover
            </button>
            <button
              type="button"
              className={styles.controlButton}
              aria-pressed={activeId === id}
              onClick={() => setActiveId(activeId === id ? null : id)}
            >
              select
            </button>
          </div>
        ))}
      </div>

      <ThreeScene
        scene="campWorld"
        className={styles.frame}
        label="Camp at dusk: a low fire in front of a tent, with the ridges of the surveyed territory behind it."
        fallback={<CampArt />}
        state={state}
      />
    </>
  );
}
