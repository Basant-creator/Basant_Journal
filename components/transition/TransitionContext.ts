"use client";

import { createContext, useContext } from "react";
import type { ChapterMeta } from "@/lib/transition/chapters";
import type { TurnWeight } from "@/lib/book/registry";
import type { TransitionType } from "@/lib/transition/types";

/**
 * The lifecycle, and it is deterministic.
 *
 *   IDLE     nothing is happening, and a new navigation can always start
 *   EXIT     a navigation was announced; the current view is darkening
 *   LOADER   the mark, while the destination is on its way
 *   CHAPTER  the destination has arrived and is naming itself
 *   ENTER    the curtain is leaving
 *
 * Every path ends at IDLE. There is no state from which a later navigation
 * cannot start a new transition.
 */
export type TransitionPhase = "IDLE" | "EXIT" | "LOADER" | "CHAPTER" | "ENTER";

export interface TransitionState {
  phase: TransitionPhase;
  type: TransitionType;
  /** The route currently rendering. */
  pathname: string;
  /** The route the curtain went up over, while it is still on its way. */
  target: string | null;
  /** The chapter being announced, or null. Always the rendered route's. */
  meta: ChapterMeta | null;
  /**
   * Which way a page turn runs, and how far it travels.
   *
   * Published rather than kept private because the field book draws its own
   * turn — a leaf sweeping inside the covers, not a sheet across the whole
   * viewport, because the book never leaves the screen. The controller still
   * owns *when*; the book owns what it looks like inside its own boards.
   */
  direction: "forward" | "back";
  weight: TurnWeight;
}

export const TransitionContext = createContext<TransitionState | null>(null);

export function useTransition(): TransitionState | null {
  return useContext(TransitionContext);
}
