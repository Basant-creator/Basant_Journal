"use client";

import { useId, useState } from "react";
import styles from "./Stamp.module.css";

interface StampProps {
  /** The struck word: SURVEYED, VERIFIED, FILED. Kept to one or two words. */
  children: string;
  /** Revealed on hover or focus. The reward for reaching for the stamp. */
  note: string;
  tone?: "red" | "ink";
  /** Degrees of rotation. A stamp is never struck square. */
  tilt?: number;
}

/**
 * An ink classification mark.
 *
 * The stamp is a real button so it is reachable by keyboard and announced by a
 * screen reader, and its note is bound with `aria-describedby` rather than
 * being a visual-only tooltip — the information exists whether or not anyone
 * hovers it. This is the discovery mechanic the brief asks for: a reward for
 * exploring, never a place where content hides.
 */
export function Stamp({ children, note, tone = "red", tilt = -4 }: StampProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={styles.wrap}>
      <button
        type="button"
        className={[styles.stamp, styles[tone]].join(" ")}
        style={{ transform: `rotate(${tilt}deg)` }}
        aria-describedby={`${id}-note`}
        aria-expanded={open}
        onMouseOver={() => setOpen(true)}
        onMouseOut={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.inner}>{children}</span>
      </button>
      <span
        id={`${id}-note`}
        role="note"
        className={open ? `${styles.note} ${styles.noteOpen}` : styles.note}
      >
        {note}
      </span>
    </span>
  );
}
