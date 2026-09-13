"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";

export interface AnchorMap {
  [id: string]: [number, number, number];
}

/**
 * How wide, in metres, the control over each object should be.
 *
 * Position alone is not enough once a renderer is placing these. The
 * illustrated camp draws its objects across the full width of a 1600-unit
 * frame and sizes the hit areas to match — twelve to twenty percent each.
 * The rendered camp sees the same table from four metres away, where the
 * objects project to three to seven percent. Moving a twenty-percent box
 * onto a four-percent object puts most of the control over the objects
 * either side of it, and the three neighbours then overlap by enough that
 * whichever is drawn last takes the clicks.
 *
 * So the size travels with the position, and by the same mechanism: written
 * as a custom property, read back with the illustrated box as the fallback.
 * These are the object plus a margin, not the object — a control the exact
 * size of a notebook is a control nobody can hit.
 */
export interface AnchorSizes {
  [id: string]: number;
}

interface ObjectAnchorsProps {
  anchors: AnchorMap;
  /** Optional. Without it the DOM keeps whatever width it already had. */
  sizes?: AnchorSizes;
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
export function ObjectAnchors({ anchors, sizes, into }: ObjectAnchorsProps) {
  const { camera, size } = useThree();

  /*
    Hand the positions back when the renderer goes away.

    These properties outlive the canvas that wrote them — they are set on
    the Scene's stage, which belongs to the page, not to the scene. Without
    this the illustrated camp comes back with its controls still standing
    wherever the camera last projected them: hit areas floating clear of the
    objects they name, on a drawing that never moved.

    Every route into the fallback hits this — a lost context, reduced motion
    switched on mid-visit, a window narrowed past the compact breakpoint —
    and all three are exactly the moments when the controls need to be
    trustworthy. Clearing them restores the var() fallbacks in SceneObject,
    which are the illustrated boxes.
  */
  const ids = Object.keys(anchors).join(",");
  useEffect(() => {
    const host = into.current;
    /*
      And one flag saying that any of this is happening.

      The controls over the scene need two presentations, not two positions.
      The illustrated camp draws an object across a fifth of the frame and has
      room to write a name and a note inside it; the rendered camp sees the
      same object from four metres and has room for neither. That is a layout
      switch, and a layout switch is not something a number in a calc() can
      make cleanly.

      So the projector says once, in the DOM, that it is placing these — and
      the stylesheet does the rest. One write on mount, one removal on
      unmount, nothing per frame. It is the same contract as the properties
      themselves: nothing sets it unless a renderer is actually drawing, so
      every other case keeps the illustrated layout untouched.
    */
    if (host) host.dataset.anchored = "true";
    return () => {
      if (!host) return;
      delete host.dataset.anchored;
      for (const id of ids.split(",")) {
        host.style.removeProperty(`--anchor-${id}-x`);
        host.style.removeProperty(`--anchor-${id}-y`);
        host.style.removeProperty(`--anchor-${id}-on`);
        host.style.removeProperty(`--anchor-${id}-w`);
      }
    };
  }, [ids, into]);
  const point = useRef(new Vector3());
  /* The second projection, for width. Allocated once, like the first. */
  const edge = useRef(new Vector3());
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

      /* Width, measured rather than assumed: the same point offset along
         world x, projected too, so the control shrinks with distance
         exactly as the object does. Cheaper than it looks — one extra
         project per object per frame, and only for objects given a size. */
      const width = sizes?.[id];
      if (width !== undefined) {
        edge.current.set(x + width / 2, y, z);
        edge.current.project(camera);
        /* Clip space is two units wide and the page is a hundred percent, so
           a delta here is worth fifty — and the offset above is half the
           control, so the full width is that delta times a hundred. Getting
           this wrong is not visible as a wrong number; it is visible as four
           controls that overlap by four percent each. */
        const pw = Math.round(Math.abs(edge.current.x - point.current.x) * 1000) / 10;
        host.style.setProperty(`--anchor-${id}-w`, `${pw}%`);
      }
    }

    void size;
  });

  return null;
}
