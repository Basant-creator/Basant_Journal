"use client";

import { useEffect, useState } from "react";
import styles from "./SceneTitle.module.css";

interface SceneTitleProps {
  /** Roman numeral or short mark. Omit for a location reveal with no chapter. */
  chapter?: string;
  title: string;
  subtitle?: string;
  /** Unique per scene; used to show the card only once per session. */
  sceneId: string;
}

/**
 * The cinematic title that plays when you arrive somewhere.
 *
 * Three rules shape how this is built, and all three come from earlier
 * contracts that this one does not get to overturn:
 *
 *   1. It never hides content. The page renders underneath, complete, from the
 *      server. This is an overlay that appears and leaves.
 *   2. Its resting state is invisible. The animation runs 0 -> 1 -> 0, so if
 *      animations never run the card is simply never seen — it cannot get
 *      stuck over the page.
 *   3. It never blocks. `pointer-events: none` throughout, `aria-hidden`
 *      (the page's real <h1> carries the same words), and it is skipped
 *      entirely under reduced motion.
 *
 * Shown once per scene per session, so walking back through a location does
 * not replay it — a chapter card on every navigation would be an interruption
 * rather than a transition.
 */
export function SceneTitle({ chapter, title, subtitle, sceneId }: SceneTitleProps) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const key = `frontier.scene.${sceneId}`;
    try {
      if (window.sessionStorage.getItem(key) === "1") return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Blocked storage: the card plays every time rather than never.
    }

    setPlay(true);
    const timer = setTimeout(() => setPlay(false), 2200);
    return () => clearTimeout(timer);
  }, [sceneId]);

  if (!play) return null;

  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.veil} />
      <div className={styles.plate}>
        <span className={styles.ruleTop} />
        {chapter ? <p className={styles.chapter}>Chapter {chapter}</p> : null}
        <p className={styles.title}>{title}</p>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        <span className={styles.ruleBottom} />
      </div>
    </div>
  );
}
