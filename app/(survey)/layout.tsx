import styles from "./layout.module.css";

/**
 * The ground every page inside the frontier shares.
 *
 * Deliberately thin: the dark field, and a `main` for the skip link to land
 * in. What used to be here as well — the navigation bar — has moved down into
 * the (world) group, because §43 of the field-book brief rules a conventional
 * navbar out *inside the book*, and the cleanest way to honour that is for the
 * book's routes never to be under a layout that renders one.
 *
 * So the split is structural rather than conditional:
 *
 *   (world)  Camp and the professional view — a navigation bar
 *   (book)   the field book's leaves — bookmarks, and no bar at all
 *
 * Neither group changes a URL. A route group is a file-system fact.
 */
export default function SurveyLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className={styles.shell}>{children}</div>;
}
