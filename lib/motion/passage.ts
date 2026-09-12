/**
 * Passages — the cinematic between two routes.
 *
 * A passage is announced by whatever control is about to navigate, and picked
 * up by the paper wipe living in the survey layout. The wipe survives the
 * route change because the layout does; the page it covers is replaced
 * underneath it.
 *
 * Two rules, both inherited from the routing contract and neither negotiable:
 *
 *   1. **A passage never delays navigation.** It is announced alongside the
 *      click and the browser is not asked to wait for anything. If nothing
 *      listens, or animation is unavailable, the route change is exactly what
 *      it is today.
 *   2. **A passage never gates content.** The wipe is decoration over a page
 *      that rendered from the server, it takes no pointer events, and it
 *      always opens — on arrival, or on a hard timeout if arrival never
 *      comes.
 *
 * It is a module-level subscription rather than a context because the two
 * ends live on opposite sides of the layout/page boundary and have no common
 * ancestor worth threading a provider through.
 */

export interface Passage {
  /**
   * Stable per journey. It seeds the tear, so the same journey comes apart
   * along the same seam every time — the trail from camp has its own edge.
   */
  id: string;
  /** The pathname it lands on. The wipe holds until it matches. */
  to: string;
  /** Where it left, printed small on the cover. */
  from?: string;
  /** Where it is going, printed large. */
  caption?: string;
}

type Listener = (passage: Passage) => void;

const listeners = new Set<Listener>();

export function onPassage(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function beginPassage(passage: Passage): void {
  // Copied before iterating: a listener that unsubscribes itself mid-notify
  // is legal, and should not truncate the notification.
  for (const listener of [...listeners]) listener(passage);
}

/**
 * Whether this click is the kind that actually navigates *here*.
 *
 * A middle click, a modified click and a right click all either open a new
 * tab or do nothing at all — and a wipe over a page that is not going
 * anywhere is a bug the visitor has to wait out. Cheaper to ask.
 */
export function isPlainNavigation(event: {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
}): boolean {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  );
}
