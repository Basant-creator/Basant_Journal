import type { Metadata } from "next";
import { Paper } from "@/components/paper/Paper";
import { TechnicalDiagram } from "@/components/record/TechnicalDiagram";
import {
  DIAGRAM_HEIGHT,
  DIAGRAM_WIDTH,
  RecordDiagram,
} from "@/components/record/diagrams/RecordDiagram";
import { DocumentStamp } from "@/components/record/DocumentStamp";
import { projects } from "@/lib/content/portfolio";
import { identityFor } from "@/lib/record/identity";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Project identities — Lab",
  robots: { index: false, follow: false },
};

/**
 * Step 16's deliverable, side by side.
 *
 * The test is not whether any one of these looks good on its own — it is
 * whether three records read as distinctly different while obviously coming
 * out of the same drawing office. That can only be judged with all three in
 * one view, which is what this page is for.
 *
 * Everything here is rendered from the same identity data the real records
 * use. If a stock or a mark changes, this page changes with it.
 */
export default function IdentitiesLabPage() {
  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Project identities</h1>
        <p className={styles.lede}>
          Three stocks, three marks, three figures. What is deliberately the
          same: the headings, the rules, the measure, the sheet numbering, the
          drawing weights, the arrowheads and the small caps. What changes is
          the paper and what is drawn on it — which is the whole of how three
          documents can be different without being from different places.
        </p>
      </header>

      <div className={styles.grid}>
        {projects.map((project) => {
          const identity = identityFor(project.id);
          return (
            <section key={project.id} className={styles.cell}>
              <div className={styles.meta}>
                <h2 className={styles.name}>{project.title}</h2>
                <p className={styles.role}>{project.subtitle}</p>
                <code className={styles.token}>{identity.stock}</code>
              </div>

              <Paper variant={identity.stock} className={styles.sheet}>
                <DocumentStamp
                  mark={identity.stamp.mark}
                  note={identity.stamp.note}
                  filing={`record ${project.chapter}`}
                />
                <TechnicalDiagram
                  figure={identity.figure.label}
                  caption={identity.figure.caption}
                  width={DIAGRAM_WIDTH}
                  height={DIAGRAM_HEIGHT}
                >
                  <RecordDiagram project={project.id} />
                </TechnicalDiagram>
              </Paper>
            </section>
          );
        })}
      </div>
    </>
  );
}
