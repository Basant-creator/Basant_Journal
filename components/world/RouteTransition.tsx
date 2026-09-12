"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Passage, onPassage } from "@/lib/motion/passage";
import { prefersReducedMotion } from "@/lib/scene/announce";
import { TornPaperTransition } from "./TornPaperTransition";
import styles from "./RouteTransition.module.css";

/** Never flickers. Below this the wipe is a flash, not a transition. */
const MIN_HOLD = 460;

/**
 * Always opens. If the arrival never comes — a failed route, a blocked
 * click, a navigation the browser quietly declined — the cover leaves anyway.
 * Nothing on this site is allowed to strand a visitor behind paper.
 */
const MAX_HOLD = 1500;

/** Long enough for the tear to finish (--paper-reveal) before unmounting. */
const RETIRE = 900;

/**
 * The paper wipe between routes.
 *
 * Mounted once in the survey layout, which is why it works at all: the layout
 * persists across a navigation inside its group, so the cover can be laid
 * down on one page and torn open on the next.
 *
 * It arrives by fading — not by closing the way it opens. The two halves
 * sliding together would be the prettier symmetry, but the route swap happens
 * in the first couple of hundred milliseconds, and a closing wipe still has a
 * gap down the middle at exactly that moment. A fade is opaque everywhere at
 * once, which is what hides a cut.
 *
 * Everything about it is inert: `pointer-events: none`, `aria-hidden`, no
 * focus, no scroll lock, and the page underneath is complete and interactive
 * the whole time.
 */
export function RouteTransition() {
  const pathname = usePathname();
  const [passage, setPassage] = useState<Passage | null>(null);
  const [open, setOpen] = useState(true);

  const startedAt = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  }, []);

  useEffect(
    () =>
      onPassage((next) => {
        // Reduced motion gets the plain route change, which is the whole of
        // what the wipe was decorating.
        if (prefersReducedMotion()) return;

        clearTimers();
        startedAt.current = Date.now();
        setPassage(next);
        setOpen(false);
        timers.current.push(window.setTimeout(() => setOpen(true), MAX_HOLD));
      }),
    [clearTimers],
  );

  // Arrival: the cover opens on the page it was going to, never before the
  // minimum hold, and never as a result of some unrelated navigation.
  useEffect(() => {
    if (!passage || open) return;
    if (pathname !== passage.to) return;

    const wait = Math.max(0, MIN_HOLD - (Date.now() - startedAt.current));
    const id = window.setTimeout(() => setOpen(true), wait);
    timers.current.push(id);
    return () => window.clearTimeout(id);
  }, [open, passage, pathname]);

  useEffect(() => {
    if (!passage || !open) return;
    const id = window.setTimeout(() => setPassage(null), RETIRE);
    timers.current.push(id);
    return () => window.clearTimeout(id);
  }, [open, passage]);

  useEffect(() => clearTimers, [clearTimers]);

  if (!passage) return null;

  return (
    <div className={styles.veil} aria-hidden="true">
      <TornPaperTransition
        className={styles.frame}
        seed={passage.id}
        open={open}
        /* A tear is the same twenty segments whether it crosses a card or a
           window, and across a window those segments are seventy pixels wide
           — which reads as a line chart, not as paper. Roughness is a
           function of the surface it happens on. */
        tear={{ segments: 72, amplitude: 0.034 }}
        tone="dark"
        cover={
          <span className={styles.card}>
            {passage.from ? <span className={styles.from}>{passage.from}</span> : null}
            <span className={styles.mark} />
            {passage.caption ? <span className={styles.to}>{passage.caption}</span> : null}
          </span>
        }
      >
        {/* Nothing beneath. What is beneath is the page. */}
        <span className={styles.hollow} />
      </TornPaperTransition>
    </div>
  );
}
