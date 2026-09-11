/**
 * First-entry choreography.
 *
 * Two rules shape how this is built:
 *
 *   1. Nothing essential may be hidden behind an animation. If JavaScript
 *      never runs, no element is left at opacity 0 — the document renders
 *      complete.
 *   2. The decision to play must be made before first paint, or the visitor
 *      sees one frame of the finished map before it rewinds.
 *
 * Both are satisfied by an inline pre-paint script that stamps the root
 * element, and CSS that only hides things when the stamp says "play". The
 * entry sequence therefore uses CSS, while interaction (camera, hover, page
 * transitions) uses Motion, where its interruptibility actually earns its
 * keep.
 */

export const VISITED_KEY = "frontier.visited";

/** Runs before paint, inline in <head>. Kept tiny and failure-tolerant. */
export const ENTRY_STAMP_SCRIPT = `(function(){try{var d=document.documentElement;var r=false;try{r=window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}var v=false;try{v=window.localStorage.getItem("${VISITED_KEY}")==="1"}catch(e){}d.setAttribute("data-entry",(r||v)?"skip":"play")}catch(e){}})();`;

export function markVisited(): void {
  try {
    window.localStorage.setItem(VISITED_KEY, "1");
  } catch {
    // Private mode or blocked storage: the sequence simply plays again.
  }
}

export function hasVisited(): boolean {
  try {
    return window.localStorage.getItem(VISITED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Ends the sequence early — any click, key or scroll completes it. */
export function completeEntry(): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-entry", "done");
  markVisited();
}
