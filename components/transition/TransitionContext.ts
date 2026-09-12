"use client";

import { createContext, useContext } from "react";
import type { ChapterMeta } from "@/lib/transition/chapters";
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
}

export const TransitionContext = createContext<TransitionState | null>(null);

export function useTransition(): TransitionState | null {
  return useContext(TransitionContext);
}
