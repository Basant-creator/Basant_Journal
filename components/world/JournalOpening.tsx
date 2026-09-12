"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { arrivingByPassage } from "@/lib/motion/passage";
import { hasSeen, markSeen, prefersReducedMotion } from "@/lib/scene/announce";
import styles from "./JournalOpening.module.css";

interface JournalOpeningProps {
  children: ReactNode;
  /** Roman numeral, stamped on the cover. */
  chapter: string;
  /** What the cover says it holds. */
  title: string;
  /** Distinguishes this journal from any other. Once per session, each. */
  id: string;
  /** The route the journal lives at, so it knows when a passage brought you. */
  route: string;
  /** The page's own root class. This component *is* the page root. */
  className?: string;
}

/**
 * The journal, opening.
 *
 * A bound cover lies over the page, swings open on its left edge, and the
 * records rise behind it. About 780ms end to end, which is the point: the
 * brief asks for a physical object, not a loading screen.
 *
 * Four rules, and the last two are the ones that make it safe:
 *
 *   1. It is this component that renders the page root, so the cover and the
 *      stagger can key off one state without the page having to know how the
 *      opening works.
 *   2. The cover is only applied after mount. The server sends a complete,
 *      open page; without JavaScript there is no cover at all.
 *   3. Once per session. A one-second cover every time you step back from a
 *      record is a door you have to open to get into your own kitchen.
 *   4. Never on top of a passage. Arriving from the trail already gets a sheet
 *      of paper torn away; a cover opening behind it is a second reveal for
 *      one arrival, and they would play over each other.
 */
export function JournalOpening({
  children,
  chapter,
  title,
  id,
  route,
  className,
}: JournalOpeningProps) {
  const [state, setState] = useState<"open" | "closed" | "opening">("open");

  /**
   * Whether this instance plays, decided once.
   *
   * React runs an effect twice in development, and the decision here depends
   * on something the effect itself writes — "have I played this yet". The
   * first run marked the journal seen and scheduled the opening; the cleanup
   * cancelled it; the second run read its own flag, said yes, and returned.
   * The cover stayed down for good. A ref outlives the effect runs, so the
   * second one resumes rather than re-deciding.
   */
  const plays = useRef<boolean | null>(null);

  useEffect(() => {
    if (plays.current === null) {
      plays.current =
        !prefersReducedMotion() &&
        !hasSeen(`journal.${id}`) &&
        !arrivingByPassage(route);
      // Marked when the decision is made, not when the sequence ends: a
      // visitor who leaves halfway has still had their opening.
      if (plays.current) markSeen(`journal.${id}`);
    }
    if (!plays.current) return;

    setState("closed");

    const open = window.setTimeout(() => setState("opening"), 60);
    const done = window.setTimeout(() => setState("open"), 1000);
    return () => {
      window.clearTimeout(open);
      window.clearTimeout(done);
    };
  }, [id, route]);

  /**
   * The net. Whatever happens above — a cancelled timer, a preference that
   * changed mid-sequence, a bug not yet written — the cover comes off.
   *
   * It hangs off `state` rather than off mount, so cancelling it requires the
   * state to have actually moved. Nothing on this site is allowed to leave a
   * page behind paper.
   */
  useEffect(() => {
    if (state === "open") return;
    const guard = window.setTimeout(() => setState("open"), 2400);
    return () => window.clearTimeout(guard);
  }, [state]);

  return (
    <div
      className={[styles.leaf, className].filter(Boolean).join(" ")}
      data-state={state}
    >
      {children}

      {state === "open" ? null : (
        <div className={styles.mount} aria-hidden="true">
          <div className={styles.cover}>
            <span className={styles.spine} />
            <span className={styles.board} />
            <span className={styles.plate}>
              <span className={styles.chapter}>Chapter {chapter}</span>
              <span className={styles.rule} />
              <span className={styles.title}>{title}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
