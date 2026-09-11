/**
 * Can this browser actually run the scene?
 *
 * Deliberately not in components/three: this answers a question *about* WebGL
 * without importing anything from three, so the check itself costs nothing and
 * can run on the cheap side of the boundary — which is the whole point, since
 * its answer decides whether the expensive side loads at all.
 */

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

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * Phones do not get the interactive scene.
 *
 * Not a capability judgement — a modern phone renders this fine — but a
 * budget one: the download, the sustained GPU draw and the battery are all
 * worse trades on a device where the composed 2D scene reads just as well.
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
  if (isCompactViewport()) return "reduced";
  if (prefersReducedMotion()) return "reduced";
  return "ready";
}
