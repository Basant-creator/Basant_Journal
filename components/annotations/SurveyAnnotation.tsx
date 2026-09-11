import type { ReactNode } from "react";
import styles from "./SurveyAnnotation.module.css";

interface SurveyAnnotationProps {
  children: ReactNode;
  /** Which side the leader rule sits on. */
  side?: "left" | "right";
  /** A small uppercase survey tag above the note: FIELD NOTE, BEARING… */
  tag?: string;
  className?: string;
}

/**
 * THE HAND, in the DOM.
 *
 * Red marks human intervention — someone looked at this and wrote something
 * down. It is never a generic accent, never a heading, and never carries
 * information that exists nowhere else. Budget across any viewport: ~3%.
 */
export function SurveyAnnotation({
  children,
  side = "left",
  tag,
  className,
}: SurveyAnnotationProps) {
  return (
    <aside
      className={[styles.note, styles[side], className].filter(Boolean).join(" ")}
    >
      {tag ? <span className={styles.tag}>{tag}</span> : null}
      <span className={styles.hand}>{children}</span>
    </aside>
  );
}
