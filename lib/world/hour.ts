/**
 * The hour of the frontier: dusk or dawn.
 *
 * Not "theme", and deliberately not "atmosphere". This site already has an
 * `AtmosphereControl`, and it switches the *sound* on — two controls sharing a
 * word in a codebase where both exist is a bug waiting for somebody to wire
 * the wrong one. §13 asks for the visitor to understand they are changing the
 * time of day rather than a stylesheet, and the code should say the same
 * thing. So: the hour.
 *
 * This is environmental state, never a route (§40). It is stamped onto
 * `<html>` as `data-hour` so CSS can read it without JavaScript, and it is
 * remembered for the session (§41) but not beyond it — the same reasoning the
 * audio preference uses, one notch softer. A remembered *look* is a much
 * smaller surprise than remembered *noise*, but a visitor who opened this once
 * at dawn should not find their next visit, weeks later, still insisting.
 */

export type Hour = "dusk" | "dawn";

/** The frontier's own hour, and the one every default falls back to. */
export const DEFAULT_HOUR: Hour = "dusk";

export const HOUR_KEY = "frontier:hour";

/** How long the light takes to cross the whole territory, in ms. */
export const SWEEP_MS = 1900;

/** The same crossing for someone who asked for less movement (§39). */
export const SWEEP_MS_REDUCED = 260;

/**
 * Stamped before first paint, exactly as the boot sequence is.
 *
 * Without this the server renders dusk, the browser reads `dawn` out of
 * storage on mount, and the visitor watches the whole page change its mind —
 * which is the one flash this phase exists to avoid. Runs inline in `<head>`,
 * touches nothing but an attribute, and swallows everything: a browser with
 * storage disabled gets the default rather than an exception.
 */
export const HOUR_STAMP_SCRIPT = `(function(){var d=document.documentElement;var h="${DEFAULT_HOUR}";try{var s=window.sessionStorage.getItem("${HOUR_KEY}");if(s==="dawn"||s==="dusk"){h=s}}catch(e){}try{d.setAttribute("data-hour",h)}catch(e){}})();`;

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

/** Reads what the pre-paint stamp decided. Safe before hydration. */
export function readHour(): Hour {
  if (typeof document === "undefined") return DEFAULT_HOUR;
  if (!hydrated) {
    const stamped = document.documentElement.getAttribute("data-hour");
    current = stamped === "dawn" ? "dawn" : "dusk";
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

export function toggleHour(): Hour {
  const next: Hour = readHour() === "dusk" ? "dawn" : "dusk";
  setHour(next);
  return next;
}

/** For `useSyncExternalStore`. */
export function subscribeHour(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The server always renders the frontier's own hour. */
export function serverHour(): Hour {
  return DEFAULT_HOUR;
}

/** 0 at dusk, 1 at dawn — the number the shaders actually want. */
export function dawnness(hour: Hour): number {
  return hour === "dawn" ? 1 : 0;
}
