import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./FieldRecordHeader.module.css";

interface FieldRecordHeaderProps {
  /** Roman numeral. Which record in the journal this is. */
  chapter: string;
  title: string;
  subtitle: string;
  /** The way back to the journal it was torn from. */
  back: { href: string; label: string };
  /** The filing data — a DocumentMeta, usually. */
  meta?: ReactNode;
  /** A struck mark: FILED, SURVEYED. */
  stamp?: ReactNode;
}

/**
 * The masthead of a field record.
 *
 * Printed matter has a head: a reference back to the volume, a number, a
 * title, and the filing data, in that order and separated by rules. This is
 * that, and it is deliberately not a hero — the record's job is to be read,
 * not to be arrived at.
 *
 * The route back is first in the DOM and first on the page because a record is
 * a document torn out of something, and the thing it came out of should be one
 * reach away rather than a scroll to the bottom.
 */
export function FieldRecordHeader({
  chapter,
  title,
  subtitle,
  back,
  meta,
  stamp,
}: FieldRecordHeaderProps) {
  return (
    <header className={styles.head}>
      <Link href={back.href} className={styles.back}>
        <span aria-hidden="true">←&nbsp;</span>
        {back.label}
      </Link>

      <div className={styles.masthead}>
        <div className={styles.titles}>
          <p className={styles.chapter}>Chapter {chapter}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
        {stamp ? <div className={styles.stamp}>{stamp}</div> : null}
      </div>

      {meta}
    </header>
  );
}
