import type { Metadata } from "next";
import { CampBench } from "./CampBench";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Camp — Lab",
  robots: { index: false, follow: false },
};

/**
 * The bench the production Camp is built on.
 *
 * `/about` runs the previous Camp and keeps running it until this one is whole
 * — a route should not be half-built for a dozen steps. `/lab` is already
 * outside the sitemap and disallowed in robots.txt, so this costs nothing but
 * a file.
 *
 * The fallback is the real illustrated camp rather than a placeholder, because
 * the two compositions have to be checked against each other constantly: the
 * rendered scene is meant to be the same place, and the fastest way to find
 * out that it is not is to be able to swap between them here.
 */
export default function CampLabPage() {
  return (
    <>
      <header>
        <h1 className={styles.title}>Camp — production scene</h1>
        <p className={styles.lede}>
          Phase 6. Built beside the Camp that <code>/about</code> is still
          using, and swapped in when there is something whole to swap. The
          fallback below is the illustrated camp — the same one the route
          serves to phones, to reduced motion, and to the first painted frame.
        </p>
      </header>

      <CampBench />
    </>
  );
}
