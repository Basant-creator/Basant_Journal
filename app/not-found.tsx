import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/cards/notice.module.css";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Not found",
  robots: { index: false, follow: true },
};

/**
 * No page at this address: a title card that says so, and the two ways in.
 * The earlier site's addresses never land here; they redirect to their
 * places in the cards (next.config.ts).
 */
export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className={styles.notice}>
      <p className={styles.kicker}>404</p>
      <h1 className={styles.title}>Wrong turn</h1>
      <p className={styles.body}>There is no page at this address. Everything lives in the title cards, or on one plain page.</p>
      <div className={styles.actions}>
        <Link href={routes.home} className={styles.go}>
          The title cards
        </Link>
        <Link href={routes.professional} className={styles.go}>
          Professional view
        </Link>
      </div>
    </main>
  );
}
