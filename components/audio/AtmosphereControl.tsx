"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { isRunning, start, stop, subscribeRunning } from "@/lib/audio/atmosphere";
import styles from "./AtmosphereControl.module.css";

/**
 * The one control for the air.
 *
 * It lives in the root layout rather than in the navigation, which is the
 * whole reason it exists in this shape: the landing page has no navigation by
 * design, and sound that can be started somewhere it cannot be stopped is not
 * a feature. Wherever the atmosphere can play, this is on screen.
 *
 * Off on arrival, every time. The preference is deliberately not remembered —
 * see lib/audio/atmosphere.ts for why a remembered "on" is worse than an
 * extra click.
 *
 * It gates nothing. Every word, figure and document on this site is complete
 * and readable with the air switched off, which is how it will be read by
 * almost everyone.
 */
export function AtmosphereControl() {
  /* Read from the audio module rather than kept here, so anything else that
     switches the air on or off — the development audition panel — shows on
     this control too. Off on the server: nothing plays before hydration. */
  const on = useSyncExternalStore(subscribeRunning, isRunning, () => false);
  const [unavailable, setUnavailable] = useState(false);

  /* Leaving the page leaves nothing running. */
  useEffect(() => stop, []);

  const toggle = useCallback(() => {
    if (on) {
      stop();
      return;
    }
    if (!start()) setUnavailable(true);
  }, [on]);

  if (unavailable) return null;

  return (
    <button
      type="button"
      className={styles.control}
      aria-pressed={on}
      onClick={toggle}
      data-on={on ? "true" : undefined}
    >
      <span className={styles.mark} aria-hidden="true">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none">
          <path
            className={styles.gust}
            d="M2 7h8.5a2.2 2.2 0 1 0-2.2-2.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M2 10.5h11a2.4 2.4 0 1 1-2.4 2.8"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            className={styles.gust}
            d="M2 14h5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            className={styles.bar}
            d="M3.5 16.5 16.5 3.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className={styles.label}>Atmosphere</span>
    </button>
  );
}
