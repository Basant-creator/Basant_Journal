"use client";

import { useEffect, useRef } from "react";
import styles from "./wall.module.css";

/**
 * A ticker: the given words run across the full width, slowly, without
 * end. Read once by a screen reader (the second copy, there only so the run
 * can loop, is hidden from it), and stopped whenever it is off screen.
 */
export function Ticker({ items, label }: { items: string[]; label: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => el.toggleAttribute("data-paused", !entry.isIntersecting), {
      root: el.closest("[data-world]"),
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} className={styles.ticker}>
      <div className={styles.run}>
        <ul className={styles.set} aria-label={label}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <ul className={styles.set} aria-hidden="true">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
