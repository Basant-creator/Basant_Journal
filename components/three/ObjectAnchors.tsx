"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Vector3 } from "three";

export interface AnchorMap {
  [id: string]: [number, number, number];
}

interface ObjectAnchorsProps {
  anchors: AnchorMap;
  /** The DOM element the projected positions are written onto. */
  into: { current: HTMLElement | null };
}

/**
 * Where the 3D objects are, told to the DOM.
 *
 * This is the seam, and it is deliberately the same seam the 2D engine already
 * uses. Scene writes `--px`/`--py` onto its stage inside one rAF and the layers
 * read them in CSS, so moving a pointer never renders a component. This writes
 * `--anchor-<id>-x/y` onto a DOM element every frame and the labels over the
 * canvas position themselves from those — same contract, one dimension more.
 *
 * The alternative was to lift projected positions into React state, which
 * would re-render the label layer sixty times a second to move four spans. The
 * 2D engine rejected that once already; there is no reason the answer changes
 * because the numbers now come from a camera.
 *
 * Two things keep it honest:
 *
 *   **Nothing is written unless it moved.** Projection runs every frame, but a
 *   custom property is only set when it changes by more than a tenth of a
 *   percent. A camera at rest writes nothing at all, so an idle scene costs no
 *   style invalidation.
 *
 *   **Nothing is allocated.** One Vector3, reused for every anchor, every
 *   frame.
 */
export function ObjectAnchors({ anchors, into }: ObjectAnchorsProps) {
  const { camera, size } = useThree();
  const point = useRef(new Vector3());
  const last = useRef<Record<string, [number, number]>>({});

  useFrame(() => {
    const host = into.current;
    if (!host) return;

    for (const id in anchors) {
      const [x, y, z] = anchors[id];
      point.current.set(x, y, z);
      point.current.project(camera);

      /* Clip space is -1..1 with y up; CSS wants 0..100% with y down. */
      const px = Math.round((point.current.x * 0.5 + 0.5) * 1000) / 10;
      const py = Math.round((-point.current.y * 0.5 + 0.5) * 1000) / 10;

      const previous = last.current[id];
      if (previous && Math.abs(previous[0] - px) < 0.1 && Math.abs(previous[1] - py) < 0.1) {
        continue;
      }
      last.current[id] = [px, py];

      host.style.setProperty(`--anchor-${id}-x`, `${px}%`);
      host.style.setProperty(`--anchor-${id}-y`, `${py}%`);
      /* Behind the camera, or off the sides: the label hides rather than
         sliding along an edge, which is what a naive projection does. */
      host.style.setProperty(
        `--anchor-${id}-on`,
        point.current.z < 1 && px > -5 && px < 105 ? "1" : "0",
      );
    }

    void size;
  });

  return null;
}
