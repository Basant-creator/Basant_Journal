"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CampArt } from "@/components/scenes/CampArt";
import {
  CampRecord,
  type CampRecordContent,
  type CampRecordId,
} from "@/components/scenes/CampRecord";
import { ThreeScene } from "@/components/three/ThreeScene";
import type { SceneProps } from "@/components/three/types";
import { routes } from "@/lib/routes";
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
 *
 * The markers over the canvas are the other half of the same idea. The scene
 * writes where each object landed on screen; these read it back. Seeing them
 * sit on the objects is the only way to know the projection is right before
 * anything is built on top of it — and a marker that has drifted is visible
 * instantly, where a wrong number in a custom property is not.
 */
export function CampBench({ record }: { record: CampRecordContent }) {
  const [hoverId, setHoverId] = useState<Id | null>(null);
  const [activeId, setActiveId] = useState<Id | null>(null);
  const anchors = useRef<HTMLDivElement | null>(null);

  const state: SceneProps = { hoverId, activeId, anchorTarget: anchors };

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
            {id === "map" ? null : (
              <button
                type="button"
                className={styles.controlButton}
                aria-pressed={activeId === id}
                onClick={() => setActiveId(activeId === id ? null : id)}
              >
                select
              </button>
            )}
          </div>
        ))}
      </div>

      <ThreeScene
        scene="campWorld"
        className={styles.frame}
        label="Camp at dusk: a low fire in front of a tent, with the ridges of the surveyed territory behind it."
        fallback={<CampArt />}
        state={state}
      >
        {/* aria-hidden: these are the bench's own instrumentation, not the
            scene's controls. The real ones arrive in step 20 and are buttons. */}
        <div className={styles.anchors} ref={anchors} aria-hidden="true">
          {OBJECTS.map((id) => (
            <span
              key={id}
              className={styles.anchor}
              style={
                {
                  "--anchor-x": `var(--anchor-${id}-x)`,
                  "--anchor-y": `var(--anchor-${id}-y)`,
                  "--anchor-on": `var(--anchor-${id}-on)`,
                } as React.CSSProperties
              }
            >
              <i className={styles.anchorDot} />
              {id}
            </span>
          ))}
        </div>
      </ThreeScene>

      {/*
        And what the open object says.

        §17: an object is picked up and a sheet of paper carries what it
        holds. The scene renders no text at all — what is on the table is an
        object, what is readable is here, in the layer THE PAPER owns. That
        split is why the illustrated camp and the rendered camp can swap
        underneath this without a word of it moving.

        The map is missing from this on purpose. It is not a record; it goes
        somewhere, and §18 gives it a route rather than a sheet.
      */}
      {activeId && activeId !== "map" ? (
        <CampRecord open={activeId as CampRecordId} {...record} />
      ) : null}
      {/*
        The map, as the route will have it. §18.

        Every other object on this bench is driven by a pair of plain
        buttons, because hover and selection are states to be poked at. The
        map is not in that family: it is a link, it goes to the survey, and
        it is never "selected" — so a select button for it would be testing
        something the route does not do.

        What it does test is the path §18 actually asks for. Pointing at this
        reports a hover, the hover crosses into the renderer as a plain prop,
        and the route drawn on the 3D map comes up. Following it leaves Camp,
        which is the other half: the scene has to let go of its context on
        the way out, not keep drawing a camp nobody is standing in.

        Hover is reported on focus and blur as well as mouse, which is the
        same contract SceneObject keeps — the geometry answers a keyboard
        exactly as it answers a pointer.
      */}
      <p className={styles.away}>
        <Link
          href={routes.frontier}
          className={styles.awayLink}
          onMouseOver={() => setHoverId("map")}
          onMouseOut={() => setHoverId(null)}
          onFocus={() => setHoverId("map")}
          onBlur={() => setHoverId(null)}
        >
          Map — back to the survey
        </Link>
      </p>

    </>
  );
}
