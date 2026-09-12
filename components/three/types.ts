import type { RefObject } from "react";

/**
 * What the DOM tells a scene.
 *
 * Plain data only — no three types, no refs into the renderer. This is the
 * payload half of the boundary: ThreeScene's signature stays free of 3D and a
 * caller still gets to drive what the canvas is doing.
 *
 * It exists because R3F renders into its own reconciler root, so React context
 * does not cross the Canvas. Rather than bridge the context — a dependency,
 * and a subtle one — the handful of values a scene actually needs are passed
 * in as props, which is also the version a reader can follow.
 */
export interface SceneProps {
  /** The object the DOM's tablist has open. */
  activeId?: string | null;
  /** The object under the pointer or keyboard focus. */
  hoverId?: string | null;
  /** Where projected object positions are written, as CSS custom properties. */
  anchorTarget?: RefObject<HTMLElement | null>;
}
