import Link from "next/link";
import { locations } from "@/lib/content/portfolio";
import {
  LOCATION_CHECKPOINT,
  type MarkerState,
  indexOfCheckpoint,
  markerState,
} from "@/lib/world/trail";
import { LocationGlyph } from "./symbols";
import styles from "./MapLegend.module.css";

interface MapLegendProps {
  activeId: string | null;
  onHover?: (id: string | null) => void;
  /** Which checkpoint the reader is standing on, as an index on the route. */
  here: number;
}

/**
 * How the index states a place's position on the walk.
 *
 * §32 asks for this in the shape it is written in the brief — a checked mark,
 * a filled one, an empty one — and the wording matters: the *same* states as
 * the trail indicator, not a second vocabulary. So "behind" is the stamp the
 * trail draws, "here" is the filled mark it fills, and "ahead" is the hollow
 * one it leaves hollow.
 *
 * A location with no checkpoint gets nothing at all. Gear is drawn on the
 * sheet and is not on the route (it is a leaf of the notebook), and giving it
 * a hollow circle would say it is a place ahead of the visitor rather than a
 * page inside one they have already reached.
 */
const STATE_LABEL: Record<MarkerState, string> = {
  behind: "Surveyed",
  here: "You are here",
  ahead: "Ahead on the trail",
};

/**
 * The sheet's index — and the map's alternative navigation path.
 *
 * A survey sheet has a legend; a spatial interface needs a non-spatial route
 * through it. Those turn out to be the same object, so this is one component
 * rather than a visible legend plus a hidden skip-list. Everything reachable
 * by pointing at the map is reachable here by tabbing a normal list of links.
 */
export function MapLegend({ activeId, onHover, here }: MapLegendProps) {
  return (
    <div className={styles.legend}>
      <div className={styles.head}>
        <span className={styles.eyebrow}>Index of locations</span>
        <span className={styles.sheet}>Sheet 1 of 1</span>
      </div>

      <ul className={styles.list}>
        {locations.map((location) => {
          const active = activeId === location.id;
          const checkpoint = LOCATION_CHECKPOINT[location.id];
          const state: MarkerState | null = checkpoint
            ? markerState(indexOfCheckpoint(checkpoint), here)
            : null;
          return (
            <li key={location.id}>
              <Link
                href={location.route}
                data-checkpoint={state ?? undefined}
                className={active ? `${styles.item} ${styles.active}` : styles.item}
                onMouseEnter={() => onHover?.(location.id)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(location.id)}
                onBlur={() => onHover?.(null)}
              >
                <span className={styles.glyph} aria-hidden="true">
                  <svg viewBox="-20 -20 40 40" width="26" height="26">
                    <LocationGlyph symbol={location.symbol} scale={0.82} strokeWidth={1.9} />
                    {/* The same tick the trail indicator stamps and the same
                        one the sheet's own markers carry, so a place that has
                        been walked says so in all three drawings. */}
                    {state === "behind" ? (
                      <path
                        className={styles.stamp}
                        d="M-9 1 l6 6.5 l12 -15"
                        fill="none"
                        strokeWidth={2.4}
                      />
                    ) : null}
                  </svg>
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>
                    {location.label}
                    <span className={styles.section}>{location.section}</span>
                  </span>
                  <span className={styles.desc}>{location.description}</span>
                </span>
                {/* Where a place sits on the walk takes precedence over
                    whether its record is written: "you are here" is the more
                    useful of the two facts, and the unmapped case still wins
                    over both because a marker with no record behind it must
                    never look like a destination. */}
                {location.status === "surveying" ? (
                  <span className={styles.status}>In survey</span>
                ) : state ? (
                  <span className={`${styles.status} ${styles.statusMapped}`}>
                    {STATE_LABEL[state]}
                  </span>
                ) : (
                  <span className={`${styles.status} ${styles.statusMapped}`}>Mapped</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.key}>
        <span className={styles.eyebrow}>Key</span>
        <ul className={styles.keyList}>
          <li>
            <svg viewBox="0 0 34 8" width="34" height="8" aria-hidden="true">
              <path
                d="M1 4 H33"
                fill="none"
                stroke="var(--map-hand)"
                strokeWidth="2"
                strokeDasharray="8 4 2 4"
              />
            </svg>
            <span>Primary trail — the engineering work</span>
          </li>
          <li>
            <svg viewBox="0 0 34 8" width="34" height="8" aria-hidden="true">
              <path
                d="M1 4 H33"
                fill="none"
                stroke="var(--map-ink-soft)"
                strokeWidth="2"
                strokeDasharray="5 4"
              />
            </svg>
            <span>Surveyed route</span>
          </li>
          <li>
            <svg viewBox="0 0 34 8" width="34" height="8" aria-hidden="true">
              <path d="M1 2.5 H33 M1 5.5 H33" fill="none" stroke="var(--map-ink)" strokeWidth="0.9" />
            </svg>
            <span>Old post road</span>
          </li>
          <li>
            <svg viewBox="0 0 34 8" width="34" height="8" aria-hidden="true">
              <path d="M1 4 Q9 1 17 4 T33 4" fill="none" stroke="var(--map-water)" strokeWidth="1.8" />
            </svg>
            <span>Watercourse</span>
          </li>
          <li>
            <svg viewBox="0 0 34 12" width="34" height="12" aria-hidden="true">
              <circle
                cx="17"
                cy="6"
                r="5"
                fill="none"
                stroke="var(--map-ink)"
                strokeWidth="1.4"
                strokeDasharray="4 4"
              />
            </svg>
            <span>Survey in progress — not yet written up</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
