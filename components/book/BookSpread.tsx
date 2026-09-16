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
 * binding and the bookmarks belong to BookShell and do not live here: this is
 * only the paper, so a spread can change without the object around it moving.
 */
export function BookSpread({ left, right, held = false }: BookSpreadProps) {
  if (held) {
    return <div className={styles.held}>{right}</div>;
  }

  return (
    <div className={left ? styles.spread : styles.single}>
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
