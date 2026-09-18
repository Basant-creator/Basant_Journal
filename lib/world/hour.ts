/**
 * The hour of the frontier: undecided, dusk, or dawn.
 *
 * Not "theme", and deliberately not "atmosphere". This site already has an
 * `AtmosphereControl`, and it switches the *sound* on — two controls sharing a
 * word in a codebase where both exist is a bug waiting for somebody to wire
 * the wrong one. §13 asks for the visitor to understand they are changing the
 * time of day rather than a stylesheet, and the code should say the same
 * thing. So: the hour.
 *
 * **`split` is the resting state, and it is the important one.** The first
 * cut of this treated the diagonal purely as a transition device: the world
 * was dusk, you pressed a control, a boundary crossed the screen, the world
 * was dawn, and the diagonal was never seen again. That is not what §9 draws —
 * its diagram shows dawn *above* the line and dusk *below it at the same
 * time* — and it wastes the whole idea. A visitor who never touches the
 * control should already be looking at one territory holding two hours, with
 * the boundary standing there as a visible question. Pressing DUSK or DAWN is
 * then answering it, and the light floods the rest of the frame.
 *
 * This is environmental state, never a route (§40). It is stamped onto
 * `<html>` as `data-hour` so CSS can read it without JavaScript, and it is
 * remembered for the session (§41) but not beyond it.
 */

export type Hour = "split" | "dusk" | "dawn";

/**
 * The frontier's own hour: neither, yet.
 *
 * A first visit shows the split, because the split is the composition. Once
 * somebody chooses, the choice is what they get back.
 */
export const DEFAULT_HOUR: Hour = "split";

export const HOUR_KEY = "frontier:hour";

/** How long the light takes to cross the whole territory, in ms. */
export const SWEEP_MS = 1900;

/** The same crossing for someone who asked for less movement (§39). */
export const SWEEP_MS_REDUCED = 260;

/* -------------------------------------------------------------------------
   WHERE THE BOUNDARY SITS

   One number describes the whole system, which is what makes reversal free.
   The diagonal's axis runs low at the bottom-left and high at the top-right;
   everything below the sweep value wears dusk and everything above it wears
   dawn. So:

     1.18  the boundary is off the top-right corner   -> all dusk
     0.72  the boundary is on screen                  -> the split
    -0.18  the boundary is off the bottom-left corner -> all dawn

   The axis is normalised in the shader so these are fractions of the way
   across the frame rather than raw dot products, which is what makes them
   mean the same thing on every window shape. They did not, once: a bare dot
   product put the resting line near the centre on one aspect ratio and in a
   corner on another.

   Choosing an hour is moving that one number, and going back is moving it the
   other way. There is no second animation to keep in step, and no state in
   which the two halves can disagree about which hour is which.

   0.72 rather than 0.5 because the title is the content (§31, §43). At 0.72
   dusk covers the lower-left seventy per cent, where every word on the page
   lives, and dawn takes the upper-right corner — so the resting composition
   keeps the dark identity the site was designed at, and the dawn wedge reads
   as a promise rather than a competitor.
   ------------------------------------------------------------------------- */

export const SWEEP_ALL_DUSK = 1.18;
export const SWEEP_SPLIT = 0.72;
export const SWEEP_ALL_DAWN = -0.18;

export function sweepFor(hour: Hour): number {
  if (hour === "dusk") return SWEEP_ALL_DUSK;
  if (hour === "dawn") return SWEEP_ALL_DAWN;
  return SWEEP_SPLIT;
}

/**
 * How far the *global* lighting has moved toward dawn, 0..1.
 *
 * Derived from the sweep rather than from the hour, so the sun keeps pace with
 * the boundary during a crossing instead of jumping when the state flips.
 *
 * Zero at the resting split, and that is the important part. Three has one
 * sun, not one per side of a diagonal, so anything global is applied to both
 * halves — and a half-dawn sun at rest lifted the dusk side along with the
 * dawn one, leaving the title on a washed background. Dusk is the resting
 * light because dusk is the resting composition; only *choosing* dawn moves
 * it. Everything that can be per-fragment already is: albedo, sky and fog.
 */
export function dawnFraction(sweep: number): number {
  if (sweep >= SWEEP_SPLIT) return 0;
  const t = (SWEEP_SPLIT - sweep) / (SWEEP_SPLIT - SWEEP_ALL_DAWN);
  return Math.min(1, Math.max(0, t));
}

/**
 * Stamped before first paint, exactly as the boot sequence is.
 *
 * Without this the server renders the split, the browser reads `dawn` out of
 * storage on mount, and the visitor watches the whole page change its mind —
 * which is the one flash this phase exists to avoid. Runs inline in `<head>`,
 * touches nothing but an attribute, and swallows everything: a browser with
 * storage disabled gets the default rather than an exception.
 */
export const HOUR_STAMP_SCRIPT = `(function(){var d=document.documentElement;var h="${DEFAULT_HOUR}";try{var s=window.sessionStorage.getItem("${HOUR_KEY}");if(s==="dawn"||s==="dusk"||s==="split"){h=s}}catch(e){}try{d.setAttribute("data-hour",h)}catch(e){}})();`;

/* -------------------------------------------------------------------------
   THE STORE

   Small enough to be a module rather than a context. The hour is read by the
   renderer, by the landing's own chrome and by the control itself, and a
   provider wrapping the tree would put a re-render between the click and the
   sweep for no benefit — the sweep is driven on the GPU, not by React.
   ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

/* Mirrors the attribute so a read never touches the DOM or storage. */
let current: Hour = DEFAULT_HOUR;
let hydrated = false;

function parse(value: string | null): Hour {
  return value === "dawn" || value === "dusk" || value === "split"
    ? value
    : DEFAULT_HOUR;
}

/** Reads what the pre-paint stamp decided. Safe before hydration. */
export function readHour(): Hour {
  if (typeof document === "undefined") return DEFAULT_HOUR;
  if (!hydrated) {
    current = parse(document.documentElement.getAttribute("data-hour"));
    hydrated = true;
  }
  return current;
}

/**
 * Moves the world to an hour.
 *
 * Idempotent on purpose: §48 asks that rapid toggling never leave a stale
 * scene, and the cheapest half of that guarantee is refusing to start a
 * crossing that is already the destination.
 */
export function setHour(next: Hour): void {
  if (typeof document === "undefined") return;
  if (readHour() === next) return;

  current = next;
  document.documentElement.setAttribute("data-hour", next);
  try {
    window.sessionStorage.setItem(HOUR_KEY, next);
  } catch {
    /* Private mode, or storage refused. The hour still changes; it simply
       will not be there next time. */
  }
  for (const listener of listeners) listener();
}

/** For `useSyncExternalStore`. */
export function subscribeHour(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
