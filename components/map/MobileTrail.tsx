import Link from "next/link";
import { locations } from "@/lib/content/portfolio";
import { terrain } from "@/lib/map/terrain";
import { LocationGlyph } from "./symbols";
import styles from "./MobileTrail.module.css";
import { routes } from "@/lib/routes";

/**
 * The mobile composition.
 *
 * Not the desktop map scaled down — a 1600 x 1000 sheet at 375px is
 * unreadable and untappable. The same journey becomes a vertical trail of
 * paper cards, travelled segments solid and the primary trail red, so the
 * language holds while the interaction becomes native to the device.
 *
 * The ridge at the top is the same generated terrain as the desktop sheet,
 * cropped — so the two compositions are visibly the same territory.
 */
export function MobileTrail() {
  return (
    <div className={styles.wrap}>
      <div className={styles.banner} aria-hidden="true">
        <svg viewBox="300 140 1120 220" preserveAspectRatio="xMidYMid slice">
          <g className={styles.ridge}>
            {terrain.mountains.ridges.map((d, i) => (
              <path key={`mr-${i}`} d={d} />
            ))}
          </g>
          <g className={styles.hachure}>
            {terrain.mountains.hachures.slice(0, 220).map((d, i) => (
              <path key={`mh-${i}`} d={d} />
            ))}
          </g>
        </svg>
        <span className={styles.bannerLabel}>Signal Ridge</span>
      </div>

      {/* The same trailhead as the sheet, as a full-width control. Nobody has
          to find and tap a hairline trail on a phone. */}
      <div className={styles.trailhead}>
        <p className={styles.trailheadTag}>Camp · Trailhead</p>
        <p className={styles.trailheadBody}>
          Begin the survey. The primary trail runs from camp straight to the
          engineering work.
        </p>
        <Link href={routes.projects} className={styles.trailheadAction}>
          Follow the trail
          <span aria-hidden="true">&nbsp;→</span>
        </Link>
      </div>

      <ol className={styles.trail}>
        {locations.map((location, index) => {
          const primary = location.weight > 1;
          return (
            <li key={location.id} className={styles.step}>
              <span className={styles.rail} aria-hidden="true">
                <span
                  className={[
                    styles.line,
                    index === 0 ? styles.lineFirst : "",
                    index === locations.length - 1 ? styles.lineLast : "",
                    primary ? styles.linePrimary : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                />
                <span className={primary ? `${styles.dot} ${styles.dotPrimary}` : styles.dot} />
              </span>

              <Link
                href={location.route}
                className={primary ? `${styles.card} ${styles.cardPrimary}` : styles.card}
              >
                <span className={styles.cardGlyph} aria-hidden="true">
                  <svg viewBox="-20 -20 40 40" width="30" height="30">
                    <LocationGlyph symbol={location.symbol} scale={0.9} strokeWidth={1.8} />
                  </svg>
                </span>
                <span className={styles.cardBody}>
                  <span className={styles.cardHead}>
                    <span className={styles.cardName}>{location.label}</span>
                    <span className={styles.cardSection}>{location.section}</span>
                  </span>
                  <span className={styles.cardDesc}>{location.description}</span>
                  {location.status === "surveying" ? (
                    <span className={styles.cardStatus}>Survey in progress</span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className={styles.shortcut}>
        <span className={styles.shortcutNote}>Prefer the plain version?</span>
        <Link href={routes.professional} className={styles.shortcutLink}>
          Professional view
        </Link>
      </div>
    </div>
  );
}
