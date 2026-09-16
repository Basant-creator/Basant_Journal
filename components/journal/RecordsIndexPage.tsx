import Link from "next/link";
import { RECORD_LEAVES } from "@/lib/journal/sections";
import { getProject } from "@/lib/content/portfolio";
import { identityFor } from "@/lib/record/identity";
import styles from "./JournalPages.module.css";

/**
 * The rear index — "Field Records", and the three of them.
 *
 * §11 asks for the back section to present differently from the main
 * navigation, and the difference here is not decoration: the contents page
 * lists *places*, this lists *filings*. So it is numbered 01–03 rather than
 * 1–6, it carries the stamp each record was struck with, and it states the
 * period — the three things a filing clerk would need and a reader of a
 * contents page would not.
 *
 * Numbers come from the content model's own order, so a fourth project
 * appears here by existing rather than by being added.
 */
export function RecordsIndexPage() {
  return (
    <div className={styles.page}>
      <h2 className={styles.sectionLabel}>Field Records</h2>
      <p className={styles.rearNote}>
        The technical record section, at the back of the book.
      </p>

      <ol className={styles.records}>
        {RECORD_LEAVES.map((record) => {
          const project = getProject(record.id);
          const identity = identityFor(record.id);
          return (
            <li key={record.id} className={styles.recordItem}>
              <Link href={record.href} className={styles.recordLink}>
                <span className={styles.recordFiling}>{record.filing}</span>
                <span className={styles.recordBody}>
                  {/* A heading, not a styled span. The index of the three
                      systems is the document outline of this page — without
                      it a screen-reader user meets one heading and a flat
                      list of links, which is what this page became when the
                      cards were replaced by leaves. */}
                  <h3 className={styles.recordTitle}>{record.title}</h3>
                  <span className={styles.recordSub}>{record.subtitle}</span>
                  <span className={styles.recordMeta}>
                    <span className={styles.recordDate}>{record.date}</span>
                    <span className={styles.recordStamp}>
                      {identity.stamp.mark}
                    </span>
                  </span>
                  {project ? (
                    <>
                      <span className={styles.recordSummary}>
                        {project.summary}
                      </span>
                      <span className={styles.recordTech}>
                        {project.technologies.slice(0, 4).join(" · ")}
                      </span>
                    </>
                  ) : null}
                </span>
                <span className={styles.recordTurn} aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
