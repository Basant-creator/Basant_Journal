import type { Metadata } from "next";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { TrailOnward } from "@/components/navigation/TrailOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { Place } from "@/components/world/Place";
import { ButtonLink } from "@/components/shared/Button";
import {
  certifications,
  education,
  getLocation,
  links,
  training,
} from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("archive");

export const metadata: Metadata = {
  title: "Archive — Records",
  description:
    "B.Tech Computer Science and Engineering at Lovely Professional University, plus training and certifications.",
  alternates: { canonical: routes.archive },
};

/** Only render a résumé link once the file is actually known to exist. */
const resumeAvailable = links.resumeStatus === "resolved";

/**
 * The Archive — the record office at the townsite.
 *
 * §25 and §26. It was a leaf of the field book, which put the formal record
 * inside the working notebook that the formal record is supposed to outlast;
 * now it is a building on the trail, an hour later in the day than the Board
 * (§24 — the world gets quieter the further the visitor walks) and lit by a
 * lamp rather than by what is left of the sun.
 *
 * The metaphor is a cabinet, not a room. §26 offers a list of possibilities
 * and the cheapest honest one is the drawer: each section is a drawer front
 * with a card in its label holder, and the records are what is filed inside
 * it. No new heavy environment — §26 is explicit — and no renderer at all.
 *
 * Every fact is the content model's. Where a certificate is not filed, the
 * record says so; that was already true and is the reason this place works
 * as an archive rather than as a wall of claims.
 */
export default function ArchivePage() {
  return (
    <Place hour="lamplight" station="Station VI · Record Office · Townsite">
      <div className={shared.page}>
        <PageHeader
          eyebrow="Archive · Records"
          title="Archive"
          lede="The record office at the townsite: degree, training and certifications, filed as they were issued."
          symbol={location?.symbol}
        />

        {/* The cabinet. Each section is a drawer front; the heading sits in the
            label holder screwed to it, and what the drawer holds is underneath.
            One object, three drawers — §26's "document cabinet", built out of a
            border and a label rather than out of a new environment. */}
        <div className={styles.cabinet}>
          <section className={`${shared.section} ${styles.drawer}`} aria-labelledby="education">
            <h2 id="education" className={`${shared.sectionHeading} ${styles.drawerLabel}`}>
              Education
            </h2>
            <ul className={shared.cardsTwo}>
              {education.map((entry) => (
                <li key={entry.institution}>
                  <PaperSurface as="article" edge="worn" className={styles.record}>
                    {entry.current ? <p className={styles.stamp}>Current</p> : null}
                    <h3 className={shared.paperTitle}>{entry.qualification}</h3>
                    <p className={styles.institution}>{entry.institution}</p>
                    <dl className={styles.facts}>
                      <div>
                        <dt>Period</dt>
                        <dd>{entry.period}</dd>
                      </div>
                      <div>
                        <dt>Place</dt>
                        <dd>{entry.place}</dd>
                      </div>
                      <div>
                        <dt>Record</dt>
                        <dd>{entry.detail}</dd>
                      </div>
                    </dl>
                  </PaperSurface>
                </li>
              ))}
            </ul>
          </section>

          <section className={`${shared.section} ${styles.drawer}`} aria-labelledby="training">
            <h2 id="training" className={`${shared.sectionHeading} ${styles.drawerLabel}`}>
              Training &amp; certifications
            </h2>
            <ul className={shared.cards}>
              {training.map((entry) => (
                <li key={entry.title}>
                  <PaperSurface as="article" edge="worn" className={styles.record}>
                    <h3 className={shared.paperTitle}>{entry.title}</h3>
                    <p className={styles.institution}>{entry.issuer}</p>
                    <p className={shared.paperBody}>{entry.body}</p>
                    <p className={shared.paperMeta}>
                      {entry.period} · {entry.detail}
                    </p>
                    {entry.certificateStatus === "unresolved" ? (
                      <p className={styles.unresolved}>Certificate not yet filed</p>
                    ) : null}
                  </PaperSurface>
                </li>
              ))}
              {certifications.map((entry) => (
                <li key={entry.title}>
                  <PaperSurface as="article" edge="worn" className={styles.record}>
                    <h3 className={shared.paperTitle}>{entry.title}</h3>
                    {entry.issuer ? <p className={styles.institution}>{entry.issuer}</p> : null}
                    <p className={shared.paperMeta}>{entry.period}</p>
                    {entry.certificateStatus === "unresolved" ? (
                      <p className={styles.unresolved}>Certificate not yet filed</p>
                    ) : null}
                  </PaperSurface>
                </li>
              ))}
            </ul>

            <SurveyAnnotation tag="Filing note" side="right" className={styles.note}>
              Where a certificate isn&rsquo;t filed, the record says so. Nothing in
              this office is claimed on memory alone.
            </SurveyAnnotation>
          </section>

          <section className={`${shared.section} ${styles.drawer}`} aria-labelledby="resume">
            <h2 id="resume" className={`${shared.sectionHeading} ${styles.drawerLabel}`}>
              The record of file
            </h2>
            <p className={shared.prose}>
              Everything in this archive, plus the full project write-ups, is
              available as one scannable page.
            </p>
            <div className={styles.actions}>
              <ButtonLink href={routes.professional} variant="primary">
                Professional view
              </ButtonLink>
              {resumeAvailable ? (
                <ButtonLink href={links.resume} variant="secondary" external>
                  Download résumé
                </ButtonLink>
              ) : (
                <p className={styles.unresolved}>
                  A downloadable résumé is not yet filed — the professional view
                  carries the same record.
                </p>
              )}
            </div>
          </section>
        </div>

        <TrailOnward />
      </div>
    </Place>
  );
}
