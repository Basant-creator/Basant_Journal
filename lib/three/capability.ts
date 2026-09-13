/**
 * Can this browser actually run the scene?
 *
 * Deliberately not in components/three: this answers a question *about* WebGL
 * without importing anything from three, so the check itself costs nothing and
 * can run on the cheap side of the boundary — which is the whole point, since
 * its answer decides whether the expensive side loads at all.
 */

import { detectQualityTier } from "./quality";

export type SceneCapability = "ready" | "unsupported" | "reduced" | "pending";

/**
 * A real context, created and immediately thrown away.
 *
 * Feature-detecting by looking for `window.WebGLRenderingContext` is not
 * enough: plenty of machines expose the constructor and then fail to give you
 * a context — blocklisted drivers, a software renderer that has been disabled,
 * too many live contexts already. The only honest test is to ask for one.
 */
export function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");

    if (!context) return false;

    // Hand the context back rather than waiting for GC. Browsers cap the
    // number of live contexts, and a probe that leaks one is a probe that
    // eventually causes the failure it was testing for.
    const lose = (context as WebGLRenderingContext).getExtension("WEBGL_lose_context");
    lose?.loseContext();

    return true;
  } catch {
    return false;
  }
}

/**
 * Reduced motion gives up the renderer, rather than freezing it.
 *
 * The other reading is tempting and wrong: keep the canvas, stop the camera,
 * stop the fire, and show a still 3D camp. It costs 880kB of renderer and a
 * live GPU context to arrive at a picture — and the project already has that
 * picture, drawn, in the layer the whole site is made of. The illustrated
 * camp is not a degraded version of the scene; it is the same place, still,
 * which is exactly what the setting asks for.
 *
 * It also keeps the promise honest. A frozen canvas is one animation anybody
 * forgets to guard away from being motion again — a flicker, a drifting
 * ember, a sway that answers the pointer. A scene that was never mounted
 * cannot move.
 *
 * Measured on /about with reduced motion asked for: scene mode "reduced",
 * zero canvases, no data-anchored on the stage, no anchor properties left
 * behind, and the object controls back at their illustrated 19.9% x 21%.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Small screens are no longer disqualifying on their own.
 *
 * They were, and the argument written here was a budget one rather than a
 * capability one: the download, the sustained draw and the battery are worse
 * trades on a device where the composed 2D scene reads just as well. That
 * argument is still true and it is no longer the whole picture. §31 of the
 * upgrade brief names LOW as a rendering tier — "mobile / weaker GPU" — and
 * reserves FALLBACK for WebGL being unavailable, which is a deliberate
 * distinction between a phone that should draw less and a phone that should
 * not draw at all.
 *
 * So the width test stays, and what it decides has changed: it no longer
 * turns the renderer off, it hands the question to the quality tier, which
 * asks about the actual machine rather than the actual window. A phone that
 * earns LOW gets the scene at one device pixel, without shadows, with a third
 * of the grass and two plumes instead of three.
 *
 * What still turns it off is `quality.ts` returning "fallback" — no WebGL at
 * all, a software rasteriser, a context that cannot hold a 4096 texture, or a
 * connection that says not to. That last one is the §39 guard: "do not
 * destroy initial page performance" and "do not sacrifice the entire
 * portfolio for one scene" are not satisfied by shipping 880kB of renderer
 * down a 3G connection to draw a campfire.
 */
export function isCompactViewport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(max-width: 860px)").matches;
  } catch {
    return false;
  }
}

/** The single decision every caller needs. */
export function detectSceneCapability(): Exclude<SceneCapability, "pending"> {
  if (!hasWebGL()) return "unsupported";
  if (prefersReducedMotion()) return "reduced";
  /* The tier decides whether this machine should draw at all. A phone that
     earns "low" draws; one the probe puts at "fallback" does not. */
  if (detectQualityTier() === "fallback") return "reduced";
  return "ready";
}
