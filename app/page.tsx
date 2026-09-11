import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/shared/Button";
import { links, meta, person } from "@/lib/content/portfolio";
import { terrain } from "@/lib/map/terrain";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: `${person.name} — The Frontier`,
  description: person.tagline,
  alternates: { canonical: "/" },
};

/**
 * Arrival.
 *
 * The first screen carries four things and nothing else: the concept, the
 * name, one sentence, and two doors. No map (that is the next scene), no
 * project cards, no metrics, no social icon row, no loading screen.
 *
 * The terrain behind is the same generated ridge as the survey sheet, cropped
 * — so entering the frontier reads as the camera pulling back from ground the
 * visitor has already seen, rather than a jump to a different place.
 */
export default function LandingPage() {
  return (
    <main id="main" className={styles.page}>
      <div className={styles.terrain} aria-hidden="true">
        <svg viewBox="280 120 1240 320" preserveAspectRatio="xMidYMax slice">
          <g className={styles.ridge}>
            {terrain.mountains.ridges.map((d, i) => (
              <path key={`r-${i}`} d={d} />
            ))}
          </g>
          <g className={styles.hachure}>
            {terrain.mountains.hachures.map((d, i) => (
              <path key={`h-${i}`} d={d} />
            ))}
          </g>
          <g className={styles.contour}>
            {terrain.contours.map((d, i) => (
              <path key={`c-${i}`} d={d} />
            ))}
          </g>
        </svg>
      </div>

      <div className={styles.inner}>
        <p className={styles.eyebrow}>
          <span>{meta.volume}</span>
          <span className={styles.eyebrowRule} aria-hidden="true" />
          <span>{meta.conceptSubtitle}</span>
        </p>

        <h1 className={styles.wordmark}>
          <span className={styles.wordmarkThe}>The</span>
          <span className={styles.wordmarkMain}>Frontier</span>
        </h1>

        <p className={styles.name}>{person.name}</p>
        <span className={styles.rule} aria-hidden="true" />

        <p className={styles.lede}>{person.tagline}</p>

        <div className={styles.doors}>
          <ButtonLink href="/frontier" variant="primary">
            Enter the frontier
          </ButtonLink>
          <ButtonLink href="/professional" variant="secondary">
            Professional view
          </ButtonLink>
        </div>

        <p className={styles.doorNote}>
          The frontier is the map. The professional view is everything, plainly,
          on one page.
        </p>
      </div>

      <footer className={styles.foot}>
        <span className={styles.footMark}>{meta.sheet}</span>
        <nav className={styles.footLinks} aria-label="Elsewhere">
          <a href={links.github} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
          <a href={links.linkedin} target="_blank" rel="noreferrer noopener">
            LinkedIn
          </a>
          <a href={`mailto:${links.email}`}>Email</a>
          <Link href="/professional">Résumé</Link>
        </nav>
      </footer>
    </main>
  );
}
