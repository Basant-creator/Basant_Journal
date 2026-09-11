import type { Metadata } from "next";
import { OnwardNav } from "@/components/shared/OnwardNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { PaperSurface } from "@/components/paper/PaperSurface";
import { SurveyAnnotation } from "@/components/annotations/SurveyAnnotation";
import { getLocation, person } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

const location = getLocation("camp");

export const metadata: Metadata = {
  title: "Camp — About",
  description: person.summary,
  alternates: { canonical: routes.about },
};

export default function AboutPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Camp · About"
        title="Camp"
        lede={person.summary}
        symbol={location?.symbol}
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
      </section>

      <section className={shared.section} aria-labelledby="interests">
        <h2 id="interests" className={shared.sectionHeading}>
          What I am working on
        </h2>
        <PaperSurface edge="worn">
          <ul className={styles.interests}>
            {person.interests.map((interest) => (
              <li key={interest} className={shared.paperBody}>
                {interest}
              </li>
            ))}
          </ul>
          <SurveyAnnotation tag="Field note" className={styles.note}>
            Third year. Still mapping — which is the point.
          </SurveyAnnotation>
        </PaperSurface>
      </section>

      <OnwardNav
        previous={{ href: routes.frontier, caption: "Back to", label: "The map" }}
        next={{ href: routes.skills, caption: "Next on the trail", label: "Gear" }}
      />
    </div>
  );
}
