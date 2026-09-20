import type { Metadata } from "next";
import { BookSpread } from "@/components/book/BookSpread";
import { LeafOnward } from "@/components/book/LeafOnward";
import { PageHeader } from "@/components/shared/PageHeader";
import { education, person } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import shared from "@/components/shared/Territory.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "The Journey — Field book",
  description: `How ${person.name} got here: education, training and the periods the three systems were built in.`,
  alternates: { canonical: routes.journey },
};

/**
 * The journey leaf.
 *
 * §17 asks for a field timeline as a spread of the book, and this is where the
 * "journey so far" went when the book swallowed the territory — it used to sit
 * under the fire at Camp, which was the wrong place for it twice over: a
 * timeline is a record, and Camp is a place. Camp keeps the fire, the table
 * and the objects on it; the route the surveyor walked to get there is a page
 * you turn to.
 *
 * Every date is `content/portfolio.json`'s. Nothing here is a milestone that
 * was invented to fill the line — §17 is explicit, and the content model is
 * the only thing that knows.
 */
export default function JourneyPage() {
  return (
    <div className={shared.page}>
      <PageHeader
        eyebrow="Field book · Journey"
        title="The Journey"
        lede="Where the surveyor has been, and when. Taken from the record, not from memory."
      />

      <BookSpread
        left={
          <div className={styles.page}>
            <p className={styles.sectionLabel}>Standing</p>
            <p className={styles.lede}>{person.summary}</p>

            <p className={styles.sectionLabel}>Schooling</p>
            <ul className={styles.timeline}>
              {education.map((entry) => (
                <li key={entry.institution} className={styles.step}>
                  <span className={styles.year}>{entry.period}</span>
                  <div className={styles.stepBody}>
                    <h3 className={styles.stepTitle}>{entry.qualification}</h3>
                    <p className={styles.prose}>
                      {entry.institution} · {entry.place}
                    </p>
                    <p className={styles.prose}>{entry.detail}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className={styles.hand}>
              Third year. Still mapping — which is the point.
            </p>
          </div>
        }
        right={
          <div className={styles.page}>
            <h2 className={styles.sectionLabel}>The ground covered</h2>
            <ol className={styles.timeline}>
              {person.journey.map((step) => (
                <li key={step.year} className={styles.step}>
                  <span className={styles.year}>{step.year}</span>
                  <div className={styles.stepBody}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.prose}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        }
      />

      {/* The first leaf, so "back" is the way out of the book rather than a
          page that does not exist. LeafOnward reads the registry for both. */}
      <LeafOnward route={routes.journey} />
    </div>
  );
}
