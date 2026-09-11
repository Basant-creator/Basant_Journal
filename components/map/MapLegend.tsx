import Link from "next/link";
import { locations } from "@/lib/content/portfolio";
import { LocationGlyph } from "./symbols";
import styles from "./MapLegend.module.css";

interface MapLegendProps {
  activeId: string | null;
  onHover?: (id: string | null) => void;
}

/**
 * The sheet's index — and the map's alternative navigation path.
 *
 * A survey sheet has a legend; a spatial interface needs a non-spatial route
 * through it. Those turn out to be the same object, so this is one component
 * rather than a visible legend plus a hidden skip-list. Everything reachable
 * by pointing at the map is reachable here by tabbing a normal list of links.
 */
export function MapLegend({ activeId, onHover }: MapLegendProps) {
  return (
    <div className={styles.legend}>
      <div className={styles.head}>
        <span className={styles.eyebrow}>Index of locations</span>
        <span className={styles.sheet}>Sheet 1 of 1</span>
      </div>

      <ul className={styles.list}>
        {locations.map((location) => {
          const active = activeId === location.id;
          return (
            <li key={location.id}>
              <Link
                href={location.route}
                className={active ? `${styles.item} ${styles.active}` : styles.item}
                onMouseEnter={() => onHover?.(location.id)}
                onMouseLeave={() => onHover?.(null)}
                onFocus={() => onHover?.(location.id)}
                onBlur={() => onHover?.(null)}
              >
                <span className={styles.glyph} aria-hidden="true">
                  <svg viewBox="-20 -20 40 40" width="26" height="26">
                    <LocationGlyph symbol={location.symbol} scale={0.82} strokeWidth={1.9} />
                  </svg>
                </span>
                <span className={styles.text}>
                  <span className={styles.name}>
                    {location.label}
                    <span className={styles.section}>{location.section}</span>
                  </span>
                  <span className={styles.desc}>{location.description}</span>
                </span>
                {location.status === "surveying" ? (
                  <span className={styles.status}>In survey</span>
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
