import { Navigation } from "@/components/navigation/Navigation";
import styles from "../layout.module.css";

/**
 * The world outside the book: Camp, and the professional view.
 *
 * These two keep the navigation bar. Camp is a place you arrive at and look
 * around, and the professional view is the practical shortcut a recruiter
 * takes — neither is a page of the field book, and both want the ordinary
 * linear route across the top.
 */
export default function WorldLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navigation />
      <main id="main" className={styles.main}>
        {children}
      </main>
    </>
  );
}
