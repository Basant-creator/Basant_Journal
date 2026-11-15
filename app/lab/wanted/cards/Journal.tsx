"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { triggerPaperRustle } from "@/lib/audio/atmosphere";
import { Shot } from "./Shot";
import styles from "./journal.module.css";

export type Entry = { date: string; title: string; by: string | null; proof: string | null; detail: string | null };

function Page({ heading, entries, folio, start }: { heading: string; entries: Entry[]; folio: string; start: number }) {
  let line = start;
  const ink = (children: ReactNode, className: string) => (
    <span className={`${styles.ink} ${className}`} style={{ "--d": line++ } as CSSProperties}>
      {children}
    </span>
  );
  return (
    <div className={styles.page}>
      <h4 className={styles.heading}>{heading}</h4>
      <ol className={styles.entries}>
        {entries.map((e) => (
          <li key={e.title} className={styles.entry}>
            {ink(e.date, styles.date)}
            {ink(e.title, styles.title)}
            {e.by || e.detail ? ink([e.by, e.detail].filter(Boolean).join(" · "), styles.by) : null}
            {e.proof
              ? ink(
                  <a href={e.proof} target="_blank" rel="noreferrer noopener">
                    certificate on file
                  </a>,
                  styles.proof,
                )
              : null}
          </li>
        ))}
      </ol>
      <span className={styles.folio}>{folio}</span>
    </div>
  );
}

/**
 * The papers, kept in a journal: a leather-bound book on the desk, its
 * cover stitched round, brass on the corners, its title in gilt worn thin,
 * and a strap buckled across. When the desk comes into view the strap is
 * let go and the cover swings open on its spine, and the entries are
 * written onto the ruled pages in ink, one after another: schooling on the
 * left, certificates and training on the right. Tap the book to close it,
 * and again to open it.
 *
 * On a phone it is bound at the top, a notebook, and opens upward. With
 * reduced motion it simply lies open, written.
 */
export function Journal({ owner, left, right }: { owner: string; left: Entry[]; right: Entry[] }) {
  const [open, setOpen] = useState(false);
  const leftLines = left.reduce((n, e) => n + 2 + (e.by || e.detail ? 1 : 0) + (e.proof ? 1 : 0), 0);

  const toggle = (next = !open) => {
    triggerPaperRustle();
    setOpen(next);
  };

  return (
    <Shot className={styles.scene} light="50% 0%" onSeen={() => toggle(true)} threshold={0.5}>
      <span className={styles.desk} aria-hidden="true" />
      <div className={styles.book} data-open={open ? "" : undefined}>
        <div className={styles.block}>
          <Page heading="Certificates & training" entries={right} folio="ii" start={leftLines} />
          <span className={styles.ribbon} aria-hidden="true" />
        </div>

        <div className={styles.cover}>
          <div className={styles.front}>
            <span className={styles.stitch} aria-hidden="true" />
            <span className={styles.titleBlock}>
              <span className={styles.gilt}>The Record</span>
              <span className={styles.rule} aria-hidden="true" />
              <span className={styles.owner}>{owner}</span>
            </span>
            <span className={`${styles.corner} ${styles.cornerTop}`} aria-hidden="true" />
            <span className={`${styles.corner} ${styles.cornerBottom}`} aria-hidden="true" />
          </div>
          <div className={styles.inside}>
            <Page heading="Schooling" entries={left} folio="i" start={0} />
          </div>
        </div>

        <span className={styles.strap} aria-hidden="true">
          <span className={styles.buckle} />
        </span>

        <button type="button" className={styles.handle} aria-pressed={open} onClick={() => toggle()}>
          {open ? "Close the journal" : "Open the journal"}
        </button>
      </div>
    </Shot>
  );
}
