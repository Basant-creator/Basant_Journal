import Link from "next/link";
import { JOURNAL_SECTIONS } from "@/lib/journal/sections";
import { meta, person } from "@/lib/content/portfolio";
import styles from "./JournalPages.module.css";

/**
 * The contents page — the verso of the opening spread.
 *
 * §7 asks for the first major spread to act as the notebook's table of
 * contents, and §35 is equally clear that the notebook is a presentation over
 * routes that already exist. So every line here is a link to a canonical
 * route, and the "page numbers" are the book's own spine order rather than
 * invented pagination: a reader who counts them and compares against the tabs
 * finds the same sequence, because both read the same array.
 *
 * The plate at the head is the cover material (§6), printed on the contents
 * page instead of behind a cover the reader has to click through. A notebook
 * you must open before you can read it is a door in front of a door — the
 * opening itself is carried by the transition from Camp.
 */
export function ContentsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.plate}>
        <p className={styles.owner}>{person.name}</p>
        <p className={styles.bookTitle}>Field Journal</p>
        <p className={styles.bookSub}>
          Engineering records · {meta.volume}
        </p>
      </div>

      <h2 className={styles.sectionLabel}>Contents</h2>

      <ol className={styles.contents}>
        {JOURNAL_SECTIONS.map((section, i) => (
          <li key={section.id} className={styles.contentsItem}>
            <Link href={section.href} className={styles.contentsLink}>
              <span className={styles.contentsNo}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={styles.contentsBody}>
                <span className={styles.contentsTitle}>{section.title}</span>
                <span className={styles.contentsHand}>{section.hand}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className={styles.marginNote}>
        Kept at camp, on the table by the fire. Corrections in the margin are
        the record, not a mistake in it.
      </p>
    </div>
  );
}
