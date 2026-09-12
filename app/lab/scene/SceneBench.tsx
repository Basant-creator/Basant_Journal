"use client";

import { useState } from "react";
import { useObjectState } from "@/components/scene/SceneContext";
import { Scene } from "@/components/scene/Scene";
import { SceneAtmosphere } from "@/components/scene/SceneAtmosphere";
import { SceneCamera } from "@/components/scene/SceneCamera";
import { SceneInteraction } from "@/components/scene/SceneInteraction";
import { SceneObjects } from "@/components/scene/SceneObjects";
import { SceneLayer } from "@/components/scene/SceneLayer";
import { SceneObject } from "@/components/scene/SceneObject";
import { SceneTransition } from "@/components/scene/SceneTransition";
import styles from "./SceneBench.module.css";

const MARKS = {
  alpha: {
    box: { x: 16, y: 62, w: 16, h: 20 },
    focus: [360, 640] as [number, number],
  },
  beta: {
    box: { x: 44, y: 58, w: 14, h: 22 },
    focus: [760, 600] as [number, number],
  },
  gamma: {
    box: { x: 70, y: 64, w: 16, h: 20 },
    focus: [1200, 660] as [number, number],
  },
};

type MarkId = keyof typeof MARKS;
const ORDER: MarkId[] = ["alpha", "beta", "gamma"];

/**
 * Step 2's test bench.
 *
 * Deliberately abstract: three depth bands, one interactive object per band,
 * a camera, a title and the air. If the engine only worked once it had a
 * campfire in it, it would not be an engine. Nothing here shares a line with
 * the Camp scene.
 */
/** A drawn object that reads its own state from the engine, like real art. */
function Mark({ id, x }: { id: MarkId; x: number }) {
  const state = useObjectState(id);
  return (
    <g transform={`translate(${x} 640)`}>
      <g className={styles.markLift} data-state={state}>
        <rect
          className={styles.mark}
          x="-70"
          y="-70"
          width="140"
          height="140"
          rx="3"
        />
        <path className={styles.markInk} d="M -40 -18 h 80 M -40 6 h 56" />
      </g>
    </g>
  );
}

export function SceneBench() {
  const [open, setOpen] = useState<MarkId>("alpha");
  const [camera, setCamera] = useState(false);

  return (
    <div className={styles.bench}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.toggle}
          aria-pressed={camera}
          onClick={() => setCamera((v) => !v)}
        >
          {camera ? "Camera: framed" : "Camera: resting"}
        </button>
        <p className={styles.readout}>
          Open object: <strong>{open}</strong> · move the pointer for parallax ·
          arrow keys walk the objects
        </p>
      </div>

      <Scene width={1600} height={900}>
        <SceneInteraction
          order={ORDER}
          initial="alpha"
          onChange={(id) => setOpen(id as MarkId)}
        >
          <svg className={styles.art} viewBox="0 0 1600 900" aria-hidden="true">
            <SceneCamera
              target={
                camera ? { focus: MARKS[open].focus, zoom: 1.3 } : undefined
              }
            >
              {/* --- background ------------------------------------------- */}
              <SceneLayer depth={0} name="background">
                <rect
                  x="0"
                  y="0"
                  width="1600"
                  height="900"
                  className={styles.sky}
                />
                <circle cx="1240" cy="200" r="58" className={styles.disc} />
              </SceneLayer>

              {/* --- middle ------------------------------------------------ */}
              <SceneLayer depth={2} name="middle">
                <path
                  className={styles.mid}
                  d="M -100 620 L 180 430 L 380 560 L 620 360 L 900 580 L 1180 400 L 1420 570 L 1700 470 L 1700 900 L -100 900 Z"
                />
              </SceneLayer>

              {/* --- foreground -------------------------------------------- */}
              <SceneLayer depth={5} name="foreground">
                <path
                  className={styles.fore}
                  d="M -100 780 L 240 700 L 560 760 L 900 690 L 1240 770 L 1700 700 L 1700 900 L -100 900 Z"
                />
              </SceneLayer>

              {/* --- the objects themselves -------------------------------- */}
              <SceneLayer depth={6} name="objects">
                {ORDER.map((id, i) => (
                  <Mark key={id} id={id} x={380 + i * 420} />
                ))}
              </SceneLayer>
            </SceneCamera>
          </svg>

          <SceneAtmosphere variant="drift" />

          <SceneObjects label="Test objects">
            {ORDER.map((id) => (
              <SceneObject
                key={id}
                id={id}
                box={MARKS[id].box}
                label={id}
                note={`field note for ${id}`}
              />
            ))}
          </SceneObjects>
        </SceneInteraction>
      </Scene>

      <SceneTransition kind="rise" delay={120}>
        <div
          className={styles.panel}
          role="tabpanel"
          aria-label={`Record for ${open}`}
          tabIndex={0}
        >
          <p className={styles.panelTag}>Record</p>
          <p className={styles.panelBody}>
            This panel is the open object&rsquo;s record. It exists so the bench
            proves the whole loop: selecting an object changes what is shown,
            and the content is on the page whether or not anyone hovers
            anything.
          </p>
          <p className={styles.panelName}>{open}</p>
        </div>
      </SceneTransition>
    </div>
  );
}
