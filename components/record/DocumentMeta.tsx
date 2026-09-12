import Link from "next/link";
import styles from "./DocumentMeta.module.css";

export interface MetaEntry {
  term: string;
  value: string;
  /** Turns the value into a link. Internal routes only. */
  href?: string;
}

interface DocumentMetaProps {
  entries: MetaEntry[];
}

/**
 * The filing data at the head of a document.
 *
 * A definition list, because that is what it is: terms and their values. The
 * temptation is a row of divs that merely looks like one; a screen reader
 * reading "Period, May to August 2026" out of a real `dl` is the difference
 * between a document and a picture of a document.
 *
 * Values are set in tabular figures and the whole strip is ruled top and
 * bottom, the way a form is.
 */
export function DocumentMeta({ entries }: DocumentMetaProps) {
  return (
    <dl className={styles.meta}>
      {entries.map((entry) => (
        <div key={entry.term} className={styles.entry}>
          <dt className={styles.term}>{entry.term}</dt>
          <dd className={styles.value}>
            {entry.href ? (
              <Link href={entry.href} className={styles.link}>
                {entry.value}
              </Link>
            ) : (
              entry.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
