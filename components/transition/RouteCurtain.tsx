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
  /*
    A turn between two leaves is the book's own, and it is drawn inside the
    covers by BookShell — the field book never leaves the screen, so a sheet
    sweeping the whole viewport would be a page from some other object
    passing in front of it. The controller still owns the timing; nothing
    global is painted.
  */
  if (type === "BOOK_TURN") return null;

  /*
    Opening the notebook.

    Not a curtain and not a page turn: a leaf of paper rises from the table
    into the frame, holds the view for the moment the route changes behind it,
    and lifts away to leave the book open. No veil, because nothing went dark
    — the reader never left the table. No mark, because the Frontier stamp
    announces a journey and this is a hand picking something up.
  */
  /*
    ...and closing it again is the same leaf, run the other way. §18 asks for
    a believable reverse, and the only reverse a reader believes is the object
    they just watched move. `data-close` flips the origin and the direction;
    it does not get its own element, its own keyframes or its own file, which
    is the difference between a mirror and a lookalike.
  */
  if (type === "CAMP_TO_JOURNAL" || type === "JOURNAL_TO_CAMP") {
    return (
      <div
        className={styles.open}
        data-phase={phase}
        data-close={type === "JOURNAL_TO_CAMP" || undefined}
        aria-hidden="true"
      >
        <span className={styles.openLeaf} />
      </div>
    );
  }

  const showMark = phase === "EXIT" || phase === "LOADER";

  /*
    The two moves that change what the visitor is looking at rather than where
    they are standing.

    Entering the survey (§5) and stepping off it onto the ground (§8) are the
    same mechanism in opposite directions, so they are one element with a
    direction rather than two compositions: a field of paper, and a survey
    rule drawn across it. On the way in the paper opens from the horizon and
    the rule is drawn along with it — the landscape is being *surveyed*. On
    the way out the paper enlarges past the point where it is paper at all,
    and the place drawn on it is underneath.
  */
  const surveying = type === "LANDING_TO_FRONTIER" || type === "MAP_TO_CAMP";

  return (
    <div
      className={styles.curtain}
      data-phase={phase}
      data-type={type}
      data-tone={meta?.tone}
      aria-hidden="true"
    >
      <span className={styles.veil} />

      {surveying ? (
        <span className={styles.field}>
          {/* The survey line §5 step 4 asks for: one rule, drawn across the
              country, with the two end ticks a levelling staff leaves. It is
              the same red and the same weight as the hand on the sheet, so
              what appears here is recognisably what is waiting there. */}
          <span className={styles.survey}>
            <span className={styles.surveyLine} />
            <span className={styles.surveyTick} data-end="start" />
            <span className={styles.surveyTick} data-end="finish" />
          </span>
        </span>
      ) : null}

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
