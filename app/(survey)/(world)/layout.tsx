import styles from "../layout.module.css";

/**
 * The world outside the book.
 *
 * Five checkpoints and an escape hatch: the survey sheet, Camp, the Board,
 * the Archive, Trail End — and the professional view. Four of those were
 * leaves of the field book until Phase 12, which is the structural half of
 * §20 to §29: a place cannot feel like a place while it is a page of an
 * object that is lying on a table somewhere else. Moving them here is what
 * makes it true rather than styled, exactly as putting the book's routes
 * under their own group is what makes the book continuous.
 *
 * What stays in the book is the document scale: the Journey, the Journal,
 * Gear, the Notes, and the records filed at the back.
 *
 * **No navigation bar.** It was mounted here and is gone: §1 and §34 replace
 * the persistent tab list with the Frontier Trail, which is mounted once in
 * the root layout and therefore covers these two routes along with everything
 * else. Keeping both would have been §20's navigation overload, and keeping
 * the bar on the two routes the book does *not* own would have been worse —
 * one metaphor at Camp and a different one a page later.
 *
 * The professional view is off the trail entirely (§24). It is an escape
 * hatch, and a shortcut that advertises itself inside the journey it exists
 * to skip is not a shortcut.
 */
export default function WorldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="main" className={styles.main}>
      {children}
    </main>
  );
}
