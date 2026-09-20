import Link from "next/link";
import { routes } from "@/lib/routes";
import styles from "./OnwardNav.module.css";

interface Step {
  href: string;
  label: string;
  caption: string;
}

interface OnwardNavProps {
  previous?: Step;
  next?: Step;
  /**
   * Defaults to the map: no page on the frontier dead-ends.
   *
   * `null` omits it, and there is exactly one caller that wants to — the
   * survey sheet itself, where "return to the survey" is an offer to go where
   * the reader already is.
   */
  returnTo?: { href: string; label: string } | null;
}

/**
 * The foot of every page.
 *
 * Two rules it exists to enforce: no navigation path dead-ends, and the way
 * back out of a territory is the map rather than the page you happened to
 * arrive from.
 */
export function OnwardNav({
  previous,
  next,
  returnTo = { href: routes.frontier, label: "Return to map" },
}: OnwardNavProps) {
  return (
    <nav className={styles.onward} aria-label="Continue">
      <div className={styles.steps}>
        {previous ? (
          <Link href={previous.href} className={`${styles.step} ${styles.back}`}>
            <span className={styles.caption}>{previous.caption}</span>
            <span className={styles.label}>
              <span aria-hidden="true">←&nbsp;</span>
              {previous.label}
            </span>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link href={next.href} className={`${styles.step} ${styles.forward}`}>
            <span className={styles.caption}>{next.caption}</span>
            <span className={styles.label}>
              {next.label}
              <span aria-hidden="true">&nbsp;→</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
      </div>

      {returnTo ? (
        <Link href={returnTo.href} className={styles.returnLink}>
          {returnTo.label}
        </Link>
      ) : null}
    </nav>
  );
}
