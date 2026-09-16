"use client";

import type { ChapterMeta } from "@/lib/transition/chapters";
import type { TransitionType, TurnDirection } from "@/lib/transition/types";
import type { TransitionPhase } from "./TransitionContext";
import { FrontierLoader } from "./FrontierLoader";
import styles from "./RouteCurtain.module.css";

interface RouteCurtainProps {
  phase: TransitionPhase;
  type: TransitionType;
  meta: ChapterMeta | null;
  /** Which way a page turn sweeps. Ignored by every other presentation. */
  direction: TurnDirection;
  reduced: boolean;
}

/**
 * What a transition looks like.
 *
 * The controller owns *when*; this owns *what*. It is one element with a
 * phase attribute, so every visual state is a CSS rule rather than a second
 * state machine that can disagree with the first.
 *
 * Inert throughout: it takes no pointer events, holds no focus, locks no
 * scroll, and the page underneath it is complete and interactive the whole
 * time. It is a thing in front of the view, not a gate in front of the
 * content — which is also why it is `aria-hidden`: the destination's own
 * heading is what a screen reader should meet, and it is already there.
 */
export function RouteCurtain({
  phase,
  type,
  meta,
  direction,
  reduced,
}: RouteCurtainProps) {
  if (phase === "IDLE") return null;

  /*
    A page turn is a different presentation, not a lighter version of the
    same one. Worlds are entered — dark, named, announced. Leaves of the
    field journal are turned — a sheet crosses, and the reader has not put
    the book down.
  */
  if (type === "BOOK_TURN") {
    return (
      <div
        className={styles.turn}
        data-phase={phase}
        data-direction={direction}
        aria-hidden="true"
      >
        <span className={styles.leaf} />
      </div>
    );
  }

  /*
    Opening the notebook.

    Not a curtain and not a page turn: a leaf of paper rises from the table
    into the frame, holds the view for the moment the route changes behind it,
    and lifts away to leave the book open. No veil, because nothing went dark
    — the reader never left the table. No mark, because the Frontier stamp
    announces a journey and this is a hand picking something up.
  */
  if (type === "CAMP_TO_JOURNAL") {
    return (
      <div className={styles.open} data-phase={phase} aria-hidden="true">
        <span className={styles.openLeaf} />
      </div>
    );
  }

  const showMark = phase === "EXIT" || phase === "LOADER";

  return (
    <div
      className={styles.curtain}
      data-phase={phase}
      data-type={type}
      aria-hidden="true"
    >
      <span className={styles.veil} />

      {showMark ? (
        <span className={styles.mark}>
          <FrontierLoader still={reduced} />
        </span>
      ) : null}

      {meta ? (
        <span className={styles.plate}>
          {meta.chapter ? (
            <span className={styles.chapter}>Chapter {meta.chapter}</span>
          ) : null}
          <span className={styles.rule} />
          <span className={styles.title}>{meta.title}</span>
          <span className={styles.subtitle}>{meta.subtitle}</span>
        </span>
      ) : null}
    </div>
  );
}
