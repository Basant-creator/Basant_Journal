"use client";

import { useEffect, useState } from "react";
import { PROJECT_SECTIONS } from "@/lib/routes";
import styles from "./RecordNav.module.css";

/**
 * Section rail for a field record.
 *
 * The links are plain fragment anchors: the browser updates the URL, scrolls,
 * and honours `scroll-behavior` — which globals.css already switches off under
 * reduced motion. So navigation inside a record works with JavaScript
 * disabled, and this component only adds the active-section highlight on top.
 */
export function RecordNav() {
  const [active, setActive] = useState<string>(PROJECT_SECTIONS[0].id);

  useEffect(() => {
    const sections = PROJECT_SECTIONS.map((section) =>
      document.getElementById(section.id),
    ).filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActive(visible[0].target.id);
      },
      // A band near the top of the viewport: the section a reader is actually
      // looking at, rather than whatever happens to be largest on screen.
      { rootMargin: "-96px 0px -62% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className={styles.rail} aria-label="Sections of this record">
      <p className={styles.heading}>In this record</p>
      <ul className={styles.list}>
        {PROJECT_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={active === section.id ? `${styles.link} ${styles.active}` : styles.link}
              aria-current={active === section.id ? "location" : undefined}
            >
              <span className={styles.tick} aria-hidden="true" />
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
