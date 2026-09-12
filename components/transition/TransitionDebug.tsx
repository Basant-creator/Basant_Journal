"use client";

import { transitionFor } from "@/lib/transition/types";
import { useTransition } from "./TransitionContext";
import styles from "./TransitionDebug.module.css";

/**
 * The transition readout, in development only.
 *
 * `process.env.NODE_ENV` is inlined at build time and the whole component
 * folds away in production — this is not a runtime flag that could be left
 * on. It exists because the bug this phase fixed took a scripted DOM probe to
 * see at all: the failure was silent, and a route either announced itself or
 * quietly did not. A readout makes the next one visible in a glance.
 */
export function TransitionDebug() {
  const state = useTransition();
  if (process.env.NODE_ENV === "production") return null;
  if (!state) return null;

  const { phase, type, pathname, target, meta } = state;

  return (
    <aside className={styles.panel} data-phase={phase} aria-hidden="true">
      <p className={styles.row}>
        <span className={styles.key}>current</span>
        <span className={styles.value}>{pathname}</span>
      </p>
      <p className={styles.row}>
        <span className={styles.key}>next</span>
        <span className={styles.value}>{target ?? "—"}</span>
      </p>
      <p className={styles.row}>
        <span className={styles.key}>transition</span>
        <span className={styles.value}>
          {type === "NONE" ? transitionFor(null, pathname) : type}
        </span>
      </p>
      <p className={styles.row}>
        <span className={styles.key}>chapter</span>
        <span className={styles.value}>
          {meta ? `${meta.chapter ? `${meta.chapter} · ` : ""}${meta.title}` : "—"}
        </span>
      </p>
      <p className={styles.row}>
        <span className={styles.key}>state</span>
        <span className={`${styles.value} ${styles.phase}`}>{phase}</span>
      </p>
    </aside>
  );
}
