import Link from "next/link";
import styles from "./ProjectNavigation.module.css";

export interface RecordStep {
  href: string;
  label: string;
  caption: string;
}

export interface RecordExit {
  href: string;
  label: string;
  /** The quiet one. Exactly one exit should be the obvious way out. */
  quiet?: boolean;
}

interface ProjectNavigationProps {
  previous: RecordStep;
  next: RecordStep;
  exits: RecordExit[];
  label?: string;
}

/**
 * The end of a record.
 *
 * Two things, and they are not the same thing. The steps move along the
 * sequence of records; the exits leave it. Collapsing them into one row of
 * links is how a reader ends up at the bottom of a document with four
 * equally-weighted choices and no idea which is the way out.
 *
 * The routing contract is what shapes this: the sequence does not wrap, and
 * the way out of a record is the map rather than the index it was reached
 * from — Map → Journal → Record → Map. Both facts are decided by whoever
 * renders this, which is why they arrive as data rather than being inferred.
 */
export function ProjectNavigation({
  previous,
  next,
  exits,
  label = "Records",
}: ProjectNavigationProps) {
  return (
    <nav className={styles.onward} aria-label={label}>
      <div className={styles.steps}>
        <Link href={previous.href} className={styles.step}>
          <span className={styles.caption}>{previous.caption}</span>
          <span className={styles.label}>
            <span aria-hidden="true">←&nbsp;</span>
            {previous.label}
          </span>
        </Link>

        <Link href={next.href} className={`${styles.step} ${styles.forward}`}>
          <span className={styles.caption}>{next.caption}</span>
          <span className={styles.label}>
            {next.label}
            <span aria-hidden="true">&nbsp;→</span>
          </span>
        </Link>
      </div>

      <div className={styles.exits}>
        {exits.map((exit) => (
          <Link
            key={exit.href}
            href={exit.href}
            className={exit.quiet ? styles.exitQuiet : styles.exit}
          >
            {exit.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
