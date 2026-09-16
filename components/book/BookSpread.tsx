import type { ReactNode } from "react";
import { Paper } from "@/components/paper/Paper";
import styles from "./BookSpread.module.css";

interface BookSpreadProps {
  /** The verso. Omit for a single wide leaf. */
  left?: ReactNode;
  /** The recto, or the whole leaf when `left` is absent. */
  right: ReactNode;
  /**
   * The spread *holds* this content instead of printing it on a leaf.
   *
   * A field record arrives on its own stock and the board of notices arrives
   * on planks. Printing either onto a JOURNAL_PAGE first would stack two
   * papers where the eye expects one and bury the thing that makes that page
   * itself — so the book carries them instead, the way a binder holds a sheet
   * that was printed elsewhere.
   */
  held?: boolean;
}

/**
 * What is open on the boards.
 *
 * Two leaves on a wide screen and one on a phone — not two shrunk to fit,
 * which is how a book becomes unreadable at 375px (§14, §50). The boards, the
 * boards and the bookmarks belong to BookShell and do not live here: this is
 * only the paper, so a spread can change without the object around it moving.
 * The gutter is the one piece of the binding that *is* here, because it is a
 * fold in the paper rather than a part of the covers.
 */
export function BookSpread({ left, right, held = false }: BookSpreadProps) {
  if (held) {
    return <div className={styles.held}>{right}</div>;
  }

  /*
    The gutter, and only where there is one.

    It lives here rather than on the boards because this is the only place
    that knows two leaves are actually open. Drawn by the shell it spanned the
    whole board — up through the page header, which is not paper — and showed
    on single-leaf and held pages that have no gutter to show. A seam between
    two pages that are not there is just a line down the middle of a page.
  */
  return (
    <div className={left ? styles.spread : styles.single}>
      {left ? <span className={styles.gutter} aria-hidden="true" /> : null}
      {left ? (
        <Paper
          variant="JOURNAL_PAGE"
          as="section"
          className={`${styles.leaf} ${styles.verso}`}
        >
          {left}
        </Paper>
      ) : null}
      <Paper
        variant="JOURNAL_PAGE"
        as="section"
        className={`${styles.leaf} ${left ? styles.recto : styles.wide}`}
      >
        {right}
      </Paper>
    </div>
  );
}
