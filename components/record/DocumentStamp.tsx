import { Stamp } from "@/components/world/Stamp";
import styles from "./DocumentStamp.module.css";

interface DocumentStampProps {
  /** The struck word. FILED, SURVEYED, VERIFIED. One or two, never a sentence. */
  mark: string;
  /** What the strike means. Bound to the mark, not a hover-only tooltip. */
  note: string;
  /** The line printed under it: a date, a reference, a clerk. */
  filing?: string;
  tone?: "red" | "ink";
  tilt?: number;
}

/**
 * A stamp struck on a document.
 *
 * `Stamp` is the mark — an interactive, described, keyboard-reachable ink
 * classification. This is the mark *placed on paper*: it adds the filing line
 * that a real strike carries underneath, and the small amount of rotation and
 * spacing that says a hand did it rather than a layout engine.
 *
 * It composes rather than reimplements, which matters: the accessibility of a
 * stamp — the note bound with aria-describedby so the information exists
 * whether or not anyone hovers — was solved once and should stay solved.
 */
export function DocumentStamp({
  mark,
  note,
  filing,
  tone = "red",
  tilt = -5,
}: DocumentStampProps) {
  return (
    <div className={styles.strike}>
      <Stamp note={note} tone={tone} tilt={tilt}>
        {mark}
      </Stamp>
      {filing ? <p className={styles.filing}>{filing}</p> : null}
    </div>
  );
}
