import type { Metadata } from "next";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaperSurface } from "@/components/paper/PaperSurface";
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

export default function ArchivePage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Archive · Records"
        title="Archive"
        lede="The record office at the townsite: degree, training and certifications, filed as they were issued."
        symbol={location?.symbol}
      />

      <section className={shared.section} aria-labelledby="education">
        <h2 id="education" className={shared.sectionHeading}>
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

      <section className={shared.section} aria-labelledby="training">
        <h2 id="training" className={shared.sectionHeading}>
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

      <section className={shared.section} aria-labelledby="resume">
        <h2 id="resume" className={shared.sectionHeading}>
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

      <OnwardNav
        previous={{ href: routes.bounties, caption: "Back along the trail", label: "Bounties" }}
        next={{ href: routes.contact, caption: "Next on the trail", label: "Trail End" }}
      />
    </div>
  );
}
