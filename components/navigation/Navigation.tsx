"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { locations } from "@/lib/content/portfolio";
import styles from "./Navigation.module.css";

/**
 * The linear route.
 *
 * The map is the scenic way through the site; this is always available beside
 * it. Phase 1's rule: the map is never the only way to reach anything, and the
 * story is an offer rather than a toll.
 */
export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  // Close the drawer on navigation, and on Escape.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isProfessional = pathname?.startsWith("/professional");

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.mark}>
          <svg
            className={styles.markGlyph}
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M12 2.5 L15 12 L12 21.5 L9 12 Z M2.5 12 H21.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.markText}>The Frontier</span>
        </Link>

        <nav className={styles.links} aria-label="Survey locations">
          <ul className={styles.list}>
            {locations.map((location) => {
              const active = pathname === location.route;
              return (
                <li key={location.id}>
                  <Link
                    href={location.route}
                    className={active ? `${styles.link} ${styles.active}` : styles.link}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className={styles.dot} aria-hidden="true" />
                    {location.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <Link
            href={isProfessional ? "/frontier" : "/professional"}
            className={styles.toggle}
            aria-pressed={isProfessional ? true : false}
          >
            {isProfessional ? "The Frontier" : "Professional view"}
          </Link>

          <button
            type="button"
            className={styles.drawerButton}
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.srOnlyInline}>
              {open ? "Close navigation" : "Open navigation"}
            </span>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="22" height="22">
              {open ? (
                <path
                  d="M5 5 L19 19 M19 5 L5 19"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3.5 7 H20.5 M3.5 12 H20.5 M3.5 17 H20.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div id={drawerId} className={styles.drawer} data-open={open} hidden={!open}>
        <ul className={styles.drawerList}>
          {locations.map((location) => (
            <li key={location.id}>
              <Link href={location.route} className={styles.drawerLink}>
                <span className={styles.drawerLabel}>{location.label}</span>
                <span className={styles.drawerSection}>{location.section}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/professional" className={styles.drawerLink}>
              <span className={styles.drawerLabel}>Professional view</span>
              <span className={styles.drawerSection}>Everything, plainly</span>
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
