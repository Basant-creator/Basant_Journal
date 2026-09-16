import type { Metadata } from "next";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { CampScene } from "@/components/scenes/CampScene";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { education, getLocation, person } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("camp");

export const metadata: Metadata = {
  title: "Camp — About",
  description: person.summary,
  alternates: { canonical: routes.about },
};

/**
 * Camp.
 *
 * The scene carries the introduction: a notebook, a photograph and a bundle of
 * field notes rest on the table, and picking one up shows its record. The
 * journey below it stays as a plain timeline, because a sequence of years
 * reads better as a list than as an object to be found.
 */
export default function AboutPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Camp · About"
        title="Camp"
        lede="A fire, a table, and the papers that happen to be on it. Pick something up."
        symbol={location?.symbol}
      />

      <CampScene
        name={person.name}
        role={person.role}
        summary={person.summary}
        interests={person.interests}
        education={education.map((entry) => ({
          qualification: entry.qualification,
          institution: entry.institution,
          period: entry.period,
          place: entry.place,
        }))}
        mapHref={routes.frontier}
      />

      <section className={shared.section} aria-labelledby="journey">
        <h2 id="journey" className={shared.sectionHeading}>
          The journey so far
        </h2>
        <ol className={styles.timeline}>
          {person.journey.map((step) => (
            <li key={step.year} className={styles.step}>
              <span className={styles.year}>{step.year}</span>
              <div className={styles.stepBody}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={shared.prose}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <SurveyAnnotation tag="Field note" className={styles.note}>
          Third year. Still mapping — which is the point.
        </SurveyAnnotation>
      </section>

      <OnwardNav
        previous={{ href: routes.frontier, caption: "Back to", label: "The map" }}
        next={{ href: routes.skills, caption: "Next on the trail", label: "Gear" }}
      />
    </div>
  );
}
