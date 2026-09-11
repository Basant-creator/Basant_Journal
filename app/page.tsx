import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/shared/Button";
import { SceneAtmosphere } from "@/components/scene/SceneAtmosphere";
import { Wordmark } from "@/components/world/Wordmark";
import { links, meta, person } from "@/lib/content/portfolio";
import { terrain } from "@/lib/map/terrain";
import { routes } from "@/lib/routes";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: `${person.name} — The Frontier`,
  description: person.tagline,
  alternates: { canonical: routes.home },
};

/**
 * Arrival — the opening of a story rather than a title with two buttons.
 *
 * The scene plays in order: dark, then air, then a horizon, then a fragment of
 * the survey sheet surfacing, then the name, then the mark, then the way in.
 * About 2.6s on a first visit and nothing at all on a return, because the
 * whole sequence hangs off the pre-paint `data-entry` stamp.
 *
 * It is a reveal, never a gate: the document is complete in the server HTML,
 * every element's resting state is visible, and nothing here delays a click.
 * Someone who arrives mid-sequence and hits Enter goes straight through.
 */
export default function LandingPage() {
  return (
    <main id="main" className={styles.scene}>
      {/* The dark the scene opens from. It exists only while the entry plays. */}
      <div className={styles.blackout} aria-hidden="true" />

      {/* Horizon: three ridges, filled, each nearer and darker than the last. */}
      <div className={styles.horizon} aria-hidden="true">
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">
          <path d={terrain.mountains.silhouettes[0]} className={styles.ridgeFar} />
          <path d={terrain.mountains.silhouettes[1]} className={styles.ridgeMid} />
          <path d={terrain.mountains.silhouettes[2]} className={styles.ridgeNear} />
        </svg>
      </div>

      {/* A fragment of the survey sheet, surfacing out of the dark. */}
      <div className={styles.fragment} aria-hidden="true">
        <svg viewBox="300 140 1120 620" preserveAspectRatio="xMidYMid slice">
          <g className={styles.fragmentInk}>
            {terrain.contours.map((d, i) => (
              <path key={`c-${i}`} d={d} />
            ))}
            {terrain.mountains.ridges.map((d, i) => (
              <path key={`r-${i}`} d={d} />
            ))}
            <path d={terrain.river.channel} />
            {terrain.stations.lines.map((d, i) => (
              <path key={`s-${i}`} d={d} />
            ))}
          </g>
        </svg>
      </div>

      <SceneAtmosphere variant="drift" className={styles.air} />

      <div className={styles.inner}>
        <p className={styles.eyebrow}>
          <span>{meta.volume}</span>
          <span className={styles.eyebrowRule} aria-hidden="true" />
          <span>{meta.conceptSubtitle}</span>
        </p>

        <p className={styles.name}>{person.name}</p>

        <h1 className={styles.wordmark}>
          <Wordmark title="The Frontier" />
        </h1>

        <p className={styles.lede}>{person.tagline}</p>

        <div className={styles.doors}>
          <ButtonLink href={routes.frontier} variant="primary">
            Enter the frontier
          </ButtonLink>
          <ButtonLink href={routes.professional} variant="secondary">
            Professional view
          </ButtonLink>
        </div>

        <p className={styles.doorNote}>
          The frontier is the world. The professional view is everything,
          plainly, on one page.
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
          <Link href={routes.archive}>Records</Link>
        </nav>
      </footer>
    </main>
  );
}
