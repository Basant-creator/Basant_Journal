/**
 * Has this title already been shown?
 *
 * A chapter card marks a story beat, and a beat happens once — walking back
 * through a section should not replay it. Location titles are nameplates and
 * repeat freely, so they do not use this.
 *
 * Session storage, not local: a new visit is a new reading of the journal.
 */

const PREFIX = "frontier.seen.";

export function hasSeen(id: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(PREFIX + id) === "1";
  } catch {
    // Blocked storage: the card plays every time rather than never. Of the two
    // failures, a repeated flourish is kinder than a missing one.
    return false;
  }
}

export function markSeen(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PREFIX + id, "1");
  } catch {
    /* ignore */
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
