"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { locations } from "@/lib/content/portfolio";
import { routes } from "@/lib/routes";
import styles from "./Navigation.module.css";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The linear route.
 *
 * The map is the scenic way through the site; this is always available beside
 * it, on every page and in both modes. The map is never the only way to reach
 * anything.
 *
 * On phones the drawer is the reliable access mechanism, so it obeys the full
 * dialog contract: background interaction disabled, focus trapped, Escape
 * closes and returns focus to the button, and it never survives a navigation.
 */
export function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // A drawer must never outlive the navigation that was made from it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Escape closes and hands focus back; Tab is trapped inside.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }

      if (event.key !== "Tab") return;

      const panel = drawerRef.current;
      if (!panel) return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !panel.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [close, open]);

  // Background interaction off while the drawer is up.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const inProfessional = pathname?.startsWith(routes.professional) ?? false;

  return (
    <header className={styles.bar}>
      <div className={styles.inner}>
        <Link href={routes.home} className={styles.mark}>
          <svg className={styles.markGlyph} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
              const current = pathname === location.route;
              return (
                <li key={location.id}>
                  <Link
                    href={location.route}
                    className={current ? `${styles.link} ${styles.current}` : styles.link}
                    aria-current={current ? "page" : undefined}
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
          {/* Leaving the professional layer returns to the interactive world,
              not to the beginning. */}
          <Link
            href={inProfessional ? routes.frontier : routes.professional}
            className={styles.toggle}
          >
            {inProfessional ? "Return to frontier" : "Professional view"}
          </Link>

          <button
            ref={buttonRef}
            type="button"
            className={styles.drawerButton}
            aria-expanded={open}
            aria-controls={drawerId}
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => (open ? close(true) : setOpen(true))}
          >
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

      {open ? (
        <div className={styles.scrim} onClick={() => close(true)} aria-hidden="true" />
      ) : null}

      <div
        id={drawerId}
        ref={drawerRef}
        className={styles.drawer}
        data-open={open}
        hidden={!open}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
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
            <Link href={routes.frontier} className={styles.drawerLink}>
              <span className={styles.drawerLabel}>The map</span>
              <span className={styles.drawerSection}>Survey sheet</span>
            </Link>
          </li>
          <li>
            <Link href={routes.professional} className={styles.drawerLink}>
              <span className={styles.drawerLabel}>Professional view</span>
              <span className={styles.drawerSection}>Everything, plainly</span>
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
