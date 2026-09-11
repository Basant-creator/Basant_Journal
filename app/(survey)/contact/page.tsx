import type { Metadata } from "next";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { ButtonLink } from "@/components/shared/Button";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
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

export default function ContactPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Trail End · Contact"
        title="Trail End"
        lede="The map stops here, but the work does not. If you are hiring, collaborating, or just want to argue about sequencing algorithms, the fastest route is email."
        symbol={location?.symbol}
      />

      <PaperSurface edge="worn" className={styles.card}>
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

      <OnwardNav
        previous={{ href: routes.archive, caption: "Back along the trail", label: "Archive" }}
        next={{ href: routes.projects, caption: "Start again at", label: "The Journal" }}
      />
    </div>
  );
}
