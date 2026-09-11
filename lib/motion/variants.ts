/**
 * Shared Motion transitions.
 *
 * Phase 1's motion budget, encoded: transform and opacity only, nothing loops,
 * at most two things move at once, and every duration collapses under reduced
 * motion (handled by Motion's own reduced-motion support plus these values).
 */

import type { Transition } from "motion/react";

export const EASE_STANDARD = [0.2, 0.7, 0.2, 1] as const;
export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;

/** Hover and small state changes. */
export const snap: Transition = {
  duration: 0.16,
  ease: EASE_STANDARD,
};

/** Panels, annotations, anything opening. */
export const settle: Transition = {
  duration: 0.28,
  ease: EASE_STANDARD,
};

/**
 * The camera. Deliberately slow and heavily eased-out so the map reads as a
 * sheet being moved across a table rather than a game camera snapping.
 */
export const survey: Transition = {
  duration: 0.9,
  ease: EASE_CINEMATIC,
};

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  shown: { opacity: 1, y: 0 },
};

export const fade = {
  hidden: { opacity: 0 },
  shown: { opacity: 1 },
};
