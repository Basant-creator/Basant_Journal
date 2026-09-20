import type { Metadata } from "next";
import { TrailOnward } from "@/components/navigation/TrailOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { Place } from "@/components/world/Place";
import { ButtonLink } from "@/components/shared/Button";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { LocationGlyph } from "@/components/map/symbols";
import { getLocation, links, person } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("trail-end");

export const metadata: Metadata = {
  title: "Trail End — Contact",
  description: `Get in touch with ${person.name} — ${person.availability.toLowerCase()}.`,
  alternates: { canonical: routes.contact },
};

/**
 * Trail End.
 *
 * §27 asks for the last checkpoint to feel intentionally quieter, and §29 for
 * the trail line to physically terminate. Both are here and neither is a
 * flourish: the hour is the latest of the three places (see Place), and the
 * terminus below is the same red survey line that runs across the sheet,
 * arriving at the same signpost glyph the sheet draws at this location, and
 * stopping — struck through, the way a surveyor closes a chain.
 *
 * §28 is the constraint that keeps it honest: the cinematic treatment
 * supports the content rather than hiding it. Everything a visitor came here
 * for — the address, the two profiles, the place — is in the card below,
 * in real markup, above the fold, one tab away.
 */
export default function ContactPage() {
  /* No station mark on the frame here: the card below already opens with
     "Station VII · Dispatch Desk · Survey Limit", and the same sentence
     burned into the corner of the frame as well is the site talking to
     itself. */
  return (
    <Place hour="last-light">
      <div className={shared.page}>
        <PageHeader
          eyebrow="Trail End · Contact"
          title="Trail End"
          lede="The map stops here, but the work does not. If you are hiring, collaborating, or just want to argue about sequencing algorithms, the fastest route is email."
          symbol={location?.symbol}
        />

        {/*
          The terminus.

          The same line, the same ink and the same glyph as the sheet — §40's
          motif continuity, drawn literally rather than referenced. It is one
          SVG with no script behind it, aria-hidden, and the heading above it
          already says where the visitor is.
        */}
        <div className={styles.terminus} aria-hidden="true">
          <svg viewBox="0 0 400 64" className={styles.terminusMark}>
            {/* The trail, arriving. Dashed for the stretch that is behind the
                visitor and solid into the post, which is the sheet's own
                convention for travelled ground. */}
            <path className={styles.terminusTrail} d="M 4 46 Q 96 30 168 40 T 300 44" />
            {/* And stopping. A post, and the struck cross that closes a chain. */}
            <path className={styles.terminusPost} d="M 318 12 v 42 M 300 54 h 36" />
            <path className={styles.terminusStrike} d="M 344 24 l 22 20 M 366 24 l -22 20" />
            <g className={styles.terminusGlyph} transform="translate(318 14) scale(0.62)">
              <LocationGlyph symbol="signpost" scale={0.8} strokeWidth={2} />
            </g>
          </svg>
          <span className={styles.terminusNote}>End of survey</span>
        </div>

        <PaperSurface edge="worn" className={styles.card}>
          <div className={styles.stationMark}>Station VII · Dispatch Desk · Survey Limit</div>
          <p className={styles.availability}>{person.availability}</p>

          <dl className={styles.details}>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${links.email}`} className={styles.value}>
                  {links.email}
                </a>
              </dd>
            </div>
            <div>
              <dt>GitHub</dt>
              <dd>
                <a
                  href={links.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`${styles.value} ${styles.externalValue}`}
                >
                  github.com/Basant-creator
                </a>
              </dd>
            </div>
            <div>
              <dt>LinkedIn</dt>
              <dd>
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={`${styles.value} ${styles.externalValue}`}
                >
                  Basant Bhushan
                </a>
              </dd>
            </div>
            <div>
              <dt>Based in</dt>
              <dd className={styles.value}>{person.location}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <ButtonLink href={`mailto:${links.email}`} variant="primary" external>
              Send a message
            </ButtonLink>
            <ButtonLink href={routes.professional} variant="secondary">
              Professional view
            </ButtonLink>
          </div>

      <SurveyAnnotation tag="End of sheet" className={styles.note}>
        Territory beyond this point is unmapped.
      </SurveyAnnotation>
        </PaperSurface>

        {/*
          No forward step exists from here and TrailOnward renders none — §29's
          terminus, in the navigation as well as in the drawing. What it does
          render is the way back along the trail and the way back to the sheet,
          because a last page that dead-ends is a different failure from a
          trail that ends.
        */}
        <TrailOnward />
      </div>
    </Place>
  );
}
