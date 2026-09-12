"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/shared/Button";
import { routes } from "@/lib/routes";
import styles from "./not-found.module.css";

/**
 * When something goes wrong inside a route.
 *
 * The 404 already says what this site sounds like when it cannot give you
 * something: no blame, no stack trace, and the way back one click away. An
 * error deserves the same voice — a recruiter who hits one should meet the
 * survey, not a framework's default grey page.
 *
 * It reuses the 404's stylesheet deliberately. These are the same event from
 * the reader's side — a sheet that cannot be produced — and giving them two
 * different treatments would say the difference matters to anyone but us.
 *
 * `reset()` is offered first because most errors here would be transient: a
 * chunk that failed to arrive, a renderer that could not start. Trying again
 * is genuinely likely to work, and it costs nothing to ask.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /* Reported, not swallowed. There is no error service wired up here, so the
       console is the only honest destination — and a digest with nothing to
       match it against is worse than useless. */
    console.error("Route error:", error);
  }, [error]);

  return (
    <main id="main" className={styles.page}>
      <p className={styles.eyebrow}>Illegible</p>
      <h1 className={styles.title}>This sheet could not be read</h1>
      <p className={styles.body}>
        Something went wrong while drawing this part of the survey. The record
        itself is intact — it is the drawing of it that failed, and trying
        again often settles it.
      </p>
      <div className={styles.actions}>
        {/* A real button, because this one does something rather than going
            somewhere — and a link that secretly re-renders the page is a link
            that breaks middle-click, Back, and every expectation attached to
            an anchor. */}
        <Button variant="primary" onClick={reset}>
          Try this sheet again
        </Button>
        <ButtonLink href={routes.professional} variant="secondary">
          Professional view
        </ButtonLink>
      </div>
      <Link href={routes.home} className={styles.home}>
        Return to the beginning
      </Link>
    </main>
  );
}
