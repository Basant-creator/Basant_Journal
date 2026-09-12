import type { Metadata } from "next";
import Link from "next/link";
import { routes } from "@/lib/routes";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  // The lab is a working reference, not part of the portfolio.
  robots: { index: false, follow: false },
};

const BENCHES = [
  { href: "/lab/scene", label: "Scene engine" },
  { href: "/lab/titles", label: "Titles" },
  { href: "/lab/tear", label: "Torn paper" },
  { href: "/lab/paper", label: "Paper variants" },
  { href: "/lab/record", label: "Record system" },
  { href: "/lab/canvas", label: "3D boundary" },
];

/**
 * The lab.
 *
 * Test benches for the systems the scenes are built from, kept as real pages
 * so a component can be judged in a browser rather than in isolation. Not
 * linked from the site's navigation and not indexed — this is the workshop,
 * not the exhibition.
 */
export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.lab}>
      <header className={styles.bar}>
        <span className={styles.mark}>The Frontier · Lab</span>
        <nav className={styles.nav} aria-label="Test benches">
          {BENCHES.map((bench) => (
            <Link key={bench.href} href={bench.href} className={styles.link}>
              {bench.label}
            </Link>
          ))}
          <Link href={routes.home} className={styles.link}>
            Back to the site
          </Link>
        </nav>
      </header>
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
