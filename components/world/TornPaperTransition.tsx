"use client";

import { type CSSProperties, type ReactNode, useId } from "react";
import { type TearOptions, tearHalves } from "@/lib/world/torn";
import styles from "./TornPaperTransition.module.css";

interface TornPaperTransitionProps {
  /** What lies beneath the cover sheet, revealed as it tears. */
  children: ReactNode;
  /** False shows the intact cover; true tears it open. */
  open: boolean;
  seed: string;
  tear?: TearOptions;
  /** The cover's tone. The revealed surface sets its own. */
  tone?: "paper" | "light" | "dark";
  /** What the cover says while it is still intact. */
  cover?: ReactNode;
  className?: string;
}

/**
 * A sheet of paper tearing open to reveal what is underneath.
 *
 * The two halves are clipped from one generated seam, so they are exact
 * complements — whatever the top piece loses, the bottom gained. That is the
 * detail that makes them read as one sheet that came apart rather than two
 * shapes that moved.
 *
 * Both halves carry a fibre edge along the seam only, and they leave in
 * different directions at slightly different rates, because paper does not
 * separate symmetrically.
 *
 * The revealed content is always in the DOM and always readable: the cover is
 * decoration over the top of it, `aria-hidden`, and it never gates anything.
 * With animation unavailable the cover simply is not there.
 */
export function TornPaperTransition({
  children,
  open,
  seed,
  tear,
  tone = "paper",
  cover,
  className,
}: TornPaperTransitionProps) {
  const uid = useId().replace(/:/g, "");
  const { top, bottom, seam } = tearHalves(seed, tear);
  const topId = `tear-${uid}-top`;
  const bottomId = `tear-${uid}-bottom`;

  // The seam as a stroke, so the torn edge catches light on both pieces.
  const seamLine = seam
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div
      className={[styles.frame, className].filter(Boolean).join(" ")}
      data-open={open ? "true" : "false"}
    >
      <div className={styles.beneath}>{children}</div>

      <div className={styles.cover} aria-hidden="true">
        <svg className={styles.defs} focusable="false">
          <defs>
            <clipPath id={topId} clipPathUnits="objectBoundingBox">
              <path d={top} />
            </clipPath>
            <clipPath id={bottomId} clipPathUnits="objectBoundingBox">
              <path d={bottom} />
            </clipPath>
          </defs>
        </svg>

        <div
          className={`${styles.half} ${styles.top} ${styles[tone]}`}
          style={{ "--tear-clip": `url(#${topId})` } as CSSProperties}
        >
          <div className={styles.coverBody}>{cover}</div>
          <svg
            className={styles.seam}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d={seamLine} />
          </svg>
        </div>

        <div
          className={`${styles.half} ${styles.bottom} ${styles[tone]}`}
          style={{ "--tear-clip": `url(#${bottomId})` } as CSSProperties}
        >
          <svg
            className={styles.seam}
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d={seamLine} />
          </svg>
        </div>
      </div>
    </div>
  );
}
