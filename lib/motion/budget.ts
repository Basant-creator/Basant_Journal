/**
 * How much the site may move on this machine.
 *
 * `prefers-reduced-motion` is the visitor's side of that question, and every
 * component honours it at the source. This is the machine's side. The loops
 * that make the world breathe — the light crossing a page, the haze, the
 * dust, the fire — are cheap wherever a GPU composites them, and they are not
 * cheap everywhere: with no GPU the browser composites in software, and a
 * full-screen layer that changes every frame costs the whole screen every
 * frame. Measured with SwiftShader, the Board dropped to 46fps standing still.
 *
 * So a machine that has shown it is weak gets the still composition — the
 * same one reduced motion gets, component by component (see
 * `html[data-motion="still"]` beside each `prefers-reduced-motion` block). It
 * is decided from evidence, never from a guess about the device:
 *
 *   - the browser admits it is rendering without a GPU;
 *   - a scene could not hold its pace and fell back (lib/three/quality.ts);
 *   - the smoothed scroll was measured stuttering and handed back to the
 *     browser (components/shell/SmoothScroll.tsx).
 *
 * Any one of them is enough, and each lasts the session: a visit is one
 * machine. MotionBudget in the shell puts the answer on <html>.
 */

/** Fired when any of the three signals arrives mid-visit. */
export const WEAK_MACHINE_EVENT = "frontier:weak-machine";

const NATIVE_SCROLL_KEY = "frontier:native-scroll";

export function announceWeakMachine(): void {
  try {
    window.dispatchEvent(new Event(WEAK_MACHINE_EVENT));
  } catch {
    /* No window, or no events: nothing is listening either. */
  }
}

export function nativeScrollChosen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(NATIVE_SCROLL_KEY) === "1";
  } catch {
    return false;
  }
}

export function chooseNativeScroll(): void {
  try {
    window.sessionStorage.setItem(NATIVE_SCROLL_KEY, "1");
  } catch {
    /* Storage refused: this page still goes native; the next one retries. */
  }
  announceWeakMachine();
}
