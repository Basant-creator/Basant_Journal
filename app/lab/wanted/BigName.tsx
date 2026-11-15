"use client";

import { useEffect, useRef } from "react";
import styles from "./page.module.css";

/**
 * A chapter's name across the whole width, its letters cut from the
 * painting on the plate beside it (Chapter, the window entrance).
 *
 * The letters use the very file the plate's picture chose for this screen
 * (its currentSrc, once it has loaded), so the name costs nothing to
 * download and is never a second, differently sized copy of the painting.
 * Until then the letters are the bone wash under the painting alone.
 */
export function BigName({ children }: { children: string }) {
  const name = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = name.current;
    const picture = el?.closest("figure")?.querySelector("img");
    if (!el || !picture) return;
    const lend = () => {
      if (picture.currentSrc) el.style.setProperty("--texture", `url("${picture.currentSrc}")`);
    };
    if (picture.complete && picture.naturalWidth) lend();
    picture.addEventListener("load", lend);
    return () => picture.removeEventListener("load", lend);
  }, []);

  return (
    <p ref={name} className={styles.bigName} aria-hidden="true">
      {children}
    </p>
  );
}
