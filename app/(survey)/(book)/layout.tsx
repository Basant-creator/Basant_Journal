import { BookShell } from "@/components/book/BookShell";
import styles from "../layout.module.css";

/**
 * The field book, mounted once.
 *
 * This file is the architecture. Next preserves a layout across navigations
 * between the routes that share it, so putting the book here means the boards,
 * the binding, the bookmarks, the folio and the ribbon are mounted when the
 * reader opens the book and are *not* unmounted again until they close it.
 * Turning from Gear to the Archive swaps what is printed on the leaf and
 * leaves the object alone.
 *
 * That is the whole of §1's "the book never disappears", and it is worth
 * saying plainly that it is a property of where this file sits rather than of
 * any animation: an animation can only ever hide a rebuild. Nothing here
 * rebuilds.
 *
 * No navigation bar — §43. The book is its own navigation, and every
 * destination outside it is reachable from the shell's own marks.
 */
export default function BookLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main id="main" className={styles.main}>
      <BookShell>{children}</BookShell>
    </main>
  );
}
