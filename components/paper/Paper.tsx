import type { ReactNode } from "react";
import type { SurfaceTag } from "@/lib/dom/tags";
import { type TornEdge, foxingLayer, fringePath, tornPath } from "@/lib/world/torn";
import styles from "./Paper.module.css";

/**
 * The six kinds of paper in this world.
 *
 * They share one substrate. What separates them is what a real stationer's
 * difference would be — stock colour, rule, border, overlay, and the voice the
 * type is set in — not six unrelated components.
 */
export type PaperVariant =
  | "FIELD_NOTE"
  | "JOURNAL_PAGE"
  | "CASE_FILE"
  | "BLUEPRINT"
  | "NEWSPAPER"
  | "PHOTOGRAPH";

interface PaperProps {
  children: ReactNode;
  variant?: PaperVariant;
  as?: SurfaceTag;
  /** Torn edges. Omit for a cut sheet. */
  edges?: TornEdge[];
  cornerTear?: "none" | "tl" | "tr" | "br" | "bl";
  /** Seed for the tear. Required when edges are given; each sheet its own. */
  seed?: string;
  /** Degrees of rest. A sheet put down by hand is never quite square. */
  tilt?: number;
  /** A photograph's caption, printed on the mount below the image. */
  caption?: string;
  className?: string;
  id?: string;
}

/**
 * Paper.
 *
 * One substrate, six treatments. The variant sets stock, rule, border and
 * overlay through tokens; everything structural — texture, handling shadow,
 * torn edge, the surface token scope that keeps nested tags and focus rings
 * legible — is shared, so a new variant is a block of custom properties
 * rather than a new component.
 *
 * The overlay for each variant is drawn in CSS (grid, rules, halftone) rather
 * than shipped as an image: it scales to any sheet, costs nothing to
 * download, and recolours with the theme.
 */
export function Paper({
  children,
  variant = "FIELD_NOTE",
  as: Tag = "div",
  edges,
  cornerTear = "none",
  seed,
  tilt = 0,
  caption,
  className,
  id,
}: PaperProps) {
  const torn = Boolean(edges?.length && seed);
  const clipId = torn ? `paper-${seed}` : undefined;
  const fringeId = torn ? `paper-${seed}-fringe` : undefined;
  const options = { edges: edges ?? [], cornerTear };
  /* Aged where the sheet is named. An unseeded sheet is a clean one — the
     professional view's stock should not develop spots. */
  const foxing = seed ? foxingLayer(seed) : null;

  return (
    <Tag
      id={id}
      className={[styles.paper, styles[variant], "surfacePaper", className]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--tilt": `${tilt}deg`,
          ...(foxing ? { "--paper-foxing-layer": foxing } : null),
          ...(torn
            ? {
                "--paper-clip": `url(#${clipId})`,
                "--paper-fringe": `url(#${fringeId})`,
              }
            : null),
        } as React.CSSProperties
      }
      data-torn={torn ? "true" : undefined}
    >
      {torn ? (
        <svg className={styles.defs} aria-hidden="true" focusable="false">
          <defs>
            <clipPath id={clipId} clipPathUnits="objectBoundingBox">
              <path d={tornPath(seed as string, options)} />
            </clipPath>
            <clipPath id={fringeId} clipPathUnits="objectBoundingBox">
              <path d={fringePath(seed as string, options)} />
            </clipPath>
          </defs>
        </svg>
      ) : null}

      {torn ? <span className={styles.fringe} aria-hidden="true" /> : null}
      <span className={styles.stock} aria-hidden="true" />
      {foxing ? <span className={styles.foxing} aria-hidden="true" /> : null}
      <span className={styles.overlay} aria-hidden="true" />

      <div className={styles.body}>{children}</div>

      {variant === "PHOTOGRAPH" && caption ? (
        <p className={styles.caption}>{caption}</p>
      ) : null}
    </Tag>
  );
}
