"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import styles from "./shot.module.css";

/**
 * A frame of film around a piece of the record: the dark of a back room, a
 * lamp's pool of light falling from `light` (a position, as CSS), a vignette,
 * and grain. Its loops rest whenever it is off screen, and it reports when
 * it has first come into view (`onSeen`), which is when the thing inside
 * should start to happen.
 */
export function Shot({
  children,
  className,
  light = "50% 0%",
  onSeen,
  threshold = 0.4,
}: {
  children: ReactNode;
  className?: string;
  light?: string;
  onSeen?: () => void;
  threshold?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const seen = useRef(onSeen);
  seen.current = onSeen;
  const fired = useRef(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        el.toggleAttribute("data-paused", !entry.isIntersecting);
        if (entry.intersectionRatio >= threshold && !fired.current) {
          fired.current = true;
          seen.current?.();
        }
      },
      { root: el.closest("[data-world]"), threshold: [0, threshold] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      fired.current = false;
    };
  }, [threshold]);

  return (
    <div ref={root} className={`${styles.shot} ${className ?? ""}`} style={{ "--light": light } as CSSProperties}>
      {children}
      <span className={styles.light} aria-hidden="true" />
      <span className={styles.vignette} aria-hidden="true" />
      <span className={styles.grain} aria-hidden="true" />
    </div>
  );
}
