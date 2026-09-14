"use client";

import { type RefObject, useLayoutEffect } from "react";
import { prefersReducedMotion } from "@/lib/scene/announce";

/**
 * Which way the sheet came from.
 *
 * §37 asks for the notebook opening into the Paper and calls it one of the
 * signature moments of the phase. The two halves of it already existed and had
 * never been introduced: the notebook's cover swings open in the scene when it
 * is reached for, and a sheet of paper appears beside the scene carrying what
 * the notebook holds. Nothing connected them. The cover opened, and somewhere
 * else on the page a different rectangle changed its text.
 *
 * So the sheet arrives from the object it came off. Not the whole way — a
 * sheet flying two thirds of a page is a slideshow, and this scene has spent
 * eight steps earning the right not to look like one. It travels a fraction of
 * the real distance, in the real direction, and the direction is what carries
 * the meaning: the eye follows a thing that moves toward it from somewhere it
 * was already looking.
 *
 * The direction has to be measured, because the object moves. The camera
 * arrives over 1900ms, the objects are at a different place on every viewport,
 * and on a phone the controls are a row of chips under the scene rather than
 * points on a table. The bridge that projects the scene into the DOM already
 * knows where everything is; this reads the answer out of the layout rather
 * than guessing at it.
 *
 * Measured once, at the moment the sheet mounts, because that is the only
 * moment it matters. Nothing here runs per frame.
 */

/** How much of the real distance the sheet actually travels. */
const TRAVEL = 0.18;

/** Beyond this it stops being a gesture and becomes a journey. */
const LIMIT = 130;

export function useSheetArrival(
  sheet: RefObject<HTMLElement | null>,
  /** The control the sheet came from — the object's own button. */
  sourceId: string | undefined,
): void {
  useLayoutEffect(() => {
    const node = sheet.current;
    if (!node) return;

    /*
      Asked for a still composition, and a still composition is what the
      resting state already is. Writing nothing leaves the fallbacks in the
      stylesheet standing, and those are a small rise and a fade — which the
      blanket in globals.css collapses to a single 1ms iteration that lands on
      the finished state, because the animation runs from an offset toward
      normal with fill-mode: both. Nothing to undo.
    */
    if (prefersReducedMotion()) return;

    const source = sourceId ? document.getElementById(sourceId) : null;
    if (!source) return;

    const from = source.getBoundingClientRect();
    const to = node.getBoundingClientRect();
    if (!from.width || !to.width) return;

    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);

    const clamp = (value: number) => Math.max(-LIMIT, Math.min(LIMIT, value * TRAVEL));

    node.style.setProperty("--arrive-x", `${Math.round(clamp(dx))}px`);
    node.style.setProperty("--arrive-y", `${Math.round(clamp(dy))}px`);
  }, [sheet, sourceId]);
}
