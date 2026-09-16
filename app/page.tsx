import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/shared/Button";
import { LandingScene } from "@/components/landing/LandingScene";
import { ThreeScene } from "@/components/three/ThreeScene";
import { Wordmark } from "@/components/world/Wordmark";
import { links, meta, person } from "@/lib/content/portfolio";
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

      {/*
        The living frontier.

        What was here — three filled ridges and a fragment of the survey sheet
        surfacing out of the dark — is inside LandingScene now, and so is
        everything §2 asks for beyond it: depth zones carried by tone, a rider
        crossing the midground, a loose herd running its own lines, dust, the
        low sun, and a trail leading to a thread of smoke on the horizon.

        It ships no JavaScript. Every moving part is a CSS animation on
        server-rendered markup, which is how §25's "lighter than the Camp"
        is met rather than merely aimed at: there is no renderer to load.
      */}
      <div className={styles.landscape} aria-hidden="true">
        {/*
          The country, and the herd crossing it.

          Two renderings of one place. The drawing is complete on its own and
          is what every visitor sees first — three tonal bands, a trail, smoke,
          dust, all server-rendered with no JavaScript at all. The renderer
          arrives over the top of it only once the capability check has passed
          and the browser has gone idle, and it brings the one thing a drawing
          could not: horses that actually gallop.

          That order is the point. §25 wants the landing lighter than the Camp
          and it is — a 314 kB model with no textures against the Camp's 665 kB
          of props — but more importantly a visitor who never reaches the
          renderer is not looking at a placeholder. They are looking at the
          landscape, finished.

          label={null}: this is scenery. The page's own heading says where the
          visitor is, and announcing a picture in front of it would put a
          description between a reader and the way in.
        */}
        <ThreeScene
          scene="landing"
          className={styles.world}
          label={null}
          fallback={<LandingScene />}
        />
      </div>

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
