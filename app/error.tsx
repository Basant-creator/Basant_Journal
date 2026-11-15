"use client";

import Link from "next/link";
import { useEffect } from "react";
import styles from "@/components/cards/notice.module.css";
import { routes } from "@/lib/routes";

/**
 * Something went wrong inside a page: the same title card as the 404, with
 * a way to try again first, since most errors here are transient (a chunk
 * that did not arrive). Reported to the console, the only honest place with
 * no error service wired up.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className={styles.notice}>
      <p className={styles.kicker}>Error</p>
      <h1 className={styles.title}>The reel snapped</h1>
      <p className={styles.body}>Something went wrong drawing this page. Trying again usually sets it right.</p>
      <div className={styles.actions}>
        {/* A button, because this does something rather than going somewhere. */}
        <button type="button" onClick={reset} className={styles.go}>
          Try again
        </button>
        <Link href={routes.home} className={styles.go}>
          The title cards
        </Link>
      </div>
    </main>
  );
}
