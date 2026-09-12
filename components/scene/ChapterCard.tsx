"use client";

import { useEffect, useState } from "react";
import { hasSeen, markSeen, prefersReducedMotion } from "@/lib/scene/announce";
import styles from "./ChapterCard.module.css";

/**
 * The eyebrow is either a chapter numeral or a named part, never both and
 * never neither. Expressed as a union so the invalid states cannot be typed:
 * a card with two eyebrows and a card with none are both meaningless, and the
 * compiler is a better place to find that out than the page is.
 */
type ChapterCardProps = {
  title: string;
  /** Unique per beat; a beat is shown once per session. */
  id: string;
} & (
  | {
      /** Roman numeral. The act, not the page. Renders as "Chapter II". */
      chapter: string;
      label?: never;
    }
  | {
      /** A part that is not a numbered chapter: "Prologue". Renders as given. */
      label: string;
      chapter?: never;
    }
);

/**
 * A chapter card — the story beat.
 *
 * This is the heavier of the two title components and the rarer one. It takes
 * the whole viewport, darkens everything behind it, and announces that the
 * reader has moved into a new act. Reserved for the three beats that are
 * actually acts — the territory, Camp, the Journal; using one on every route
 * would make it an interruption rather than a transition.
 *
 * Three constraints shape the build, all inherited and none negotiable:
 *
 *   1. It never hides content. The page is complete underneath, from the
 *      server. This is an overlay that arrives and leaves.
 *   2. Its resting state is invisible — the sequence runs 0 to 1 to 0 — so an
 *      animation that never runs means an unseen card, never a card stranded
 *      over the page.
 *   3. It never blocks. pointer-events: none throughout, aria-hidden because
 *      the page's own h1 already carries the words, and skipped entirely
 *      under reduced motion.
 */
export function ChapterCard({ chapter, label, title, id }: ChapterCardProps) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (hasSeen(`chapter.${id}`)) return;

    markSeen(`chapter.${id}`);
    setPlay(true);

    const timer = setTimeout(() => setPlay(false), 2400);
    return () => clearTimeout(timer);
  }, [id]);

  if (!play) return null;

  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.veil} />
      <div className={styles.plate}>
        <span className={styles.rule} />
        <p className={styles.chapter}>{label ?? `Chapter ${chapter}`}</p>
        <p className={styles.title}>{title}</p>
        <span className={`${styles.rule} ${styles.ruleLower}`} />
      </div>
    </div>
  );
}
