import type { ReactNode } from "react";
import styles from "./TechnicalDiagram.module.css";

interface TechnicalDiagramProps {
  /** The drawing. SVG children, in the coordinate space given below. */
  children: ReactNode;
  /** "Fig. 1". Numbered, because a diagram gets referred to. */
  figure: string;
  /** What it shows. Carries the meaning for anyone not seeing the drawing. */
  caption: string;
  /** Longer description, when the caption cannot carry the whole diagram. */
  description?: string;
  width?: number;
  height?: number;
}

/**
 * A drawn figure on a document.
 *
 * The frame, the number and the caption are the system's; the drawing is the
 * project's. That split is the point of having this at all — three records
 * with three different diagrams should still look like three figures from one
 * drawing office.
 *
 * The accessibility contract is the harder half. An SVG diagram is invisible
 * to a screen reader unless someone says what it shows, so the caption is
 * required and it is bound to the figure with `aria-labelledby` rather than
 * left to float nearby. `description` is there for the diagrams whose meaning
 * genuinely does not fit in a caption; where it is given, the drawing is
 * described rather than merely named.
 */
export function TechnicalDiagram({
  children,
  figure,
  caption,
  description,
  width = 640,
  height = 360,
}: TechnicalDiagramProps) {
  const id = `fig-${figure.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;

  return (
    <figure className={styles.figure}>
      <div className={styles.frame}>
        <svg
          className={styles.drawing}
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-labelledby={description ? `${id}-cap ${id}-desc` : `${id}-cap`}
        >
          {children}
        </svg>
        <span className={styles.corner} aria-hidden="true" />
      </div>

      <figcaption className={styles.caption}>
        <span className={styles.number}>{figure}</span>
        <span id={`${id}-cap`} className={styles.captionText}>
          {caption}
        </span>
      </figcaption>

      {description ? (
        <p id={`${id}-desc`} className={styles.description}>
          {description}
        </p>
      ) : null}
    </figure>
  );
}
