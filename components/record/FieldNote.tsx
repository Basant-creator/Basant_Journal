import type { ReactNode } from "react";
import styles from "./FieldNote.module.css";

interface FieldNoteProps {
  children: ReactNode;
  /** What kind of note: OBSERVED, LATER, TO CHECK. */
  tag?: string;
  /** Pencil is the working note; ink is the one written up afterwards. */
  hand?: "pencil" | "ink";
  className?: string;
}

/**
 * Something written on the sheet while the work was happening.
 *
 * Distinct from an Annotation, and the distinction is worth keeping: an
 * annotation is red ink *over* a document — a mark someone made about it
 * afterwards, THE HAND, budgeted at about 3% of any view. A field note is
 * writing *on* the paper, in pencil or ink, part of the document rather than
 * a comment on it. One is a correction; the other is the record.
 *
 * It is an `aside` with a real tag, so it reads as a note rather than as body
 * copy that happens to be in a different typeface — and it never carries a
 * fact that exists nowhere else.
 */
export function FieldNote({ children, tag, hand = "pencil", className }: FieldNoteProps) {
  return (
    <aside className={[styles.note, styles[hand], className].filter(Boolean).join(" ")}>
      {tag ? <span className={styles.tag}>{tag}</span> : null}
      <span className={styles.body}>{children}</span>
    </aside>
  );
}
