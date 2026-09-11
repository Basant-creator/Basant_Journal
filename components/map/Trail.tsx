import type { CSSProperties } from "react";
import type { Trail as TrailModel } from "@/lib/map/locations";
import styles from "./Trail.module.css";

interface TrailProps {
  trail: TrailModel;
  /** Brightened because one of its endpoints is hovered, focused or selected. */
  lit: boolean;
}

/**
 * A surveyed route between two locations.
 *
 * Two feature classes, and they are drawn differently on purpose: a `route` is
 * a walked trail in ink; the `primary` is red, because it is not terrain — it
 * is someone's annotation about where to go first.
 *
 * `pathLength={1}` normalises every segment so one dash animation draws them
 * all regardless of real length.
 */
export function Trail({ trail, lit }: TrailProps) {
  const classes = [
    styles.trail,
    trail.kind === "primary" ? styles.primary : styles.route,
    lit ? styles.lit : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <path
      className={classes}
      d={trail.path}
      pathLength={1}
      style={{ "--trail-delay": `${560 + trail.index * 90}ms` } as CSSProperties}
    />
  );
}
