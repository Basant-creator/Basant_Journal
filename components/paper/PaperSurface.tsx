import type { ElementType, ReactNode } from "react";
import styles from "./PaperSurface.module.css";

type Tone = "default" | "light" | "field";
type Edge = "clean" | "worn";

interface PaperSurfaceProps {
  children: ReactNode;
  /** Rendered element — section, article, aside, li… */
  as?: ElementType;
  tone?: Tone;
  edge?: Edge;
  /** Degrees of rest. A document laid down by hand is never quite square. */
  tilt?: number;
  elevated?: boolean;
  className?: string;
  id?: string;
}

/**
 * THE PAPER.
 *
 * The single reusable document surface: texture, worn edge, ink border,
 * physical shadow. Journal entries, project pages, certificates and the
 * résumé all sit on this, so the paper language is defined once.
 *
 * It also re-points the contextual colour tokens (`surfacePaper` in
 * globals.css), which is what lets nested tags, labels and focus rings stay
 * legible without knowing which surface they landed on.
 */
export function PaperSurface({
  children,
  as: Tag = "div",
  tone = "default",
  edge = "clean",
  tilt = 0,
  elevated = false,
  className,
  id,
}: PaperSurfaceProps) {
  const classes = [
    styles.paper,
    "surfacePaper",
    styles[tone],
    edge === "worn" ? styles.worn : "",
    elevated ? styles.elevated : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      id={id}
      className={classes}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      <div className={styles.inner}>{children}</div>
    </Tag>
  );
}
