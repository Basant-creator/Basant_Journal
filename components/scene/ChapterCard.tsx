"use client";

import { useEffect, useState } from "react";
import { hasSeen, markSeen, prefersReducedMotion } from "@/lib/scene/announce";
import styles from "./ChapterCard.module.css";

interface ChapterCardProps {
  /** Roman numeral. The act, not the page. */
  chapter: string;
  title: string;
  /** Unique per chapter; a beat is shown once per session. */
  id: string;
}

/**
 * A chapter card — the story beat.
 *
 * This is the heavier of the two title components and the rarer one. It takes
 * the whole viewport, darkens everything behind it, and announces that the
 * reader has moved into a new act. Reserved for Camp and the Journal; using
 * one on every route would make it an interruption rather than a transition.
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
export function ChapterCard({ chapter, title, id }: ChapterCardProps) {
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
        <p className={styles.chapter}>Chapter {chapter}</p>
        <p className={styles.title}>{title}</p>
        <span className={`${styles.rule} ${styles.ruleLower}`} />
      </div>
    </div>
  );
}
