"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/scene/announce";
import styles from "./LocationTitle.module.css";

interface LocationTitleProps {
  /** Where you are. THE WORKSHOP, THE BOARD, THE ARCHIVE. */
  title: string;
  /** What it is. TOOLS OF THE TRADE, NOTABLE FINDINGS. */
  subtitle?: string;
}

/**
 * A location title — the nameplate.
 *
 * Deliberately the lighter of the two title components, and different in kind
 * from a ChapterCard:
 *
 *   ChapterCard    marks an act. Full viewport, darkens the page, once per
 *                  session, rare.
 *   LocationTitle  says where you are. Sits in the page's own header space,
 *                  never covers anything, plays on every arrival, common.
 *
 * That difference is why it repeats: a story beat happens once, but a
 * nameplate is useful every time you walk in — the way a film names a place
 * each time it cuts back to it. It is brief enough (about 1.3s) and quiet
 * enough that repetition reads as rhythm rather than interruption.
 *
 * It carries no veil and no fixed positioning, so it can never strand content
 * behind it. The page's real h1 sits underneath and is what screen readers
 * and search engines get; this is aria-hidden decoration over the top of it.
 */
export function LocationTitle({ title, subtitle }: LocationTitleProps) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    setPlay(true);
    const timer = setTimeout(() => setPlay(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  if (!play) return null;

  return (
    <div className={styles.plate} aria-hidden="true">
      <p className={styles.title}>{title}</p>
      {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      <span className={styles.rule} />
    </div>
  );
}
