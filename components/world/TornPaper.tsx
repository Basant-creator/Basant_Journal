import type { CSSProperties, ReactNode } from "react";
import type { SurfaceTag } from "@/lib/dom/tags";
import { type TornEdge, fringePath, tornPath } from "@/lib/world/torn";
import styles from "./TornPaper.module.css";

interface TornPaperProps {
  children: ReactNode;
  /**
   * Unique and stable. It seeds the tear, so the same seed always produces the
   * same edge, and it names the clip path — give each surface its own.
   */
  seed: string;
  edges?: TornEdge[];
  cornerTear?: "none" | "tl" | "tr" | "br" | "bl";
  amplitude?: number;
  segments?: number;
  tone?: "paper" | "light" | "dark";
  /** Degrees of rest. A sheet put down by hand is never quite square. */
  tilt?: number;
  as?: SurfaceTag;
  className?: string;
  id?: string;
}

/**
 * A sheet of paper with genuinely torn edges.
 *
 * The edge is a generated clip path, not a rectangle with a shadow: it bites
 * inward at an irregular rhythm, carries a finer fibre tremor, and drops the
 * occasional deep notch. A paler fringe sits behind it, offset, so the tear
 * reads as fibres pulling apart rather than as a cut.
 *
 * Because the clip is in objectBoundingBox units, one definition works at any
 * size and the sheet stays torn while it is responsive.
 */
export function TornPaper({
  children,
  seed,
  edges = ["bottom"],
  cornerTear = "none",
  amplitude,
  segments,
  tone = "paper",
  tilt = 0,
  as: Tag = "div",
  className,
  id,
}: TornPaperProps) {
  const options = { edges, cornerTear, amplitude, segments };
  const clipId = `torn-${seed}`;
  const fringeId = `torn-${seed}-fringe`;

  return (
    <Tag
      id={id}
      className={[styles.sheet, styles[tone], "surfacePaper", className]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--torn-clip": `url(#${clipId})`,
          "--torn-fringe": `url(#${fringeId})`,
          // A custom property rather than an inline transform: inline styles
          // beat every stylesheet rule, so a caller could never compose a
          // hover lift on top of the rest angle.
          "--tilt": `${tilt}deg`,
        } as CSSProperties
      }
    >
      <svg className={styles.defs} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="objectBoundingBox">
            <path d={tornPath(seed, options)} />
          </clipPath>
          <clipPath id={fringeId} clipPathUnits="objectBoundingBox">
            <path d={fringePath(seed, options)} />
          </clipPath>
        </defs>
      </svg>

      {/* The pale lip of pulled fibres, sitting just behind the sheet. */}
      <span className={styles.fringe} aria-hidden="true" />
      <span className={styles.face} aria-hidden="true" />

      <div className={styles.content}>{children}</div>
    </Tag>
  );
}
