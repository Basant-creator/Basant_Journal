"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { triggerPaperRustle } from "@/lib/audio/atmosphere";
import styles from "./RecordPacket.module.css";

export interface PacketLeaf {
  /** Matches the sheet's own anchor id, so a deep link still finds it. */
  id: string;
  /** The tab's word on the packet's own index. */
  label: string;
  node: ReactNode;
}

interface RecordPacketProps {
  leaves: PacketLeaf[];
  /** Where turning back past the first leaf goes. */
  previousRecord: { href: string; label: string } | null;
  /** Where turning forward past the last leaf goes. */
  nextRecord: { href: string; label: string } | null;
  /** Shown on every leaf: which record this is, and how far through. */
  filing: string;
}

/**
 * A project record, as a packet of pages inside the book.
 *
 * §31 is the rule that shapes this: **semantic route, internal page position.**
 * The URL says which record is open and never changes as the reader turns
 * through it, so Back walks records rather than paragraphs — §30's "do not
 * make browser Back absurd". The page position is component state, which is
 * exactly what it is: where in a document someone has read to.
 *
 * Turning past the end is not a dead stop. The last leaf of TuneIt turns into
 * OnSight, and the first leaf of OnSight turns back into TuneIt — which is
 * what a book does, and what §57's path walks. Those two moves *are* route
 * changes, because they change which record is open, and they are the only
 * ones here that touch history.
 *
 * The hash is read once on mount and never written. That keeps
 * `/projects/tuneit#metrics` working as a deep link — §29 asks for any content
 * to be linkable — without turning every page turn into a history entry.
 */
export function RecordPacket({
  leaves,
  previousRecord,
  nextRecord,
  filing,
}: RecordPacketProps) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  /* Which way the last turn ran, so the leaf can arrive from the right side. */
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const region = useRef<HTMLDivElement | null>(null);
  /* Focus moves to the new leaf only after a turn the reader asked for —
     never on first paint, which would yank the viewport on arrival. */
  const turned = useRef(false);

  /* A deep link picks the opening page. Read once; never written back. */
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const i = leaves.findIndex((leaf) => leaf.id === hash);
    if (i > 0) setPage(i);
  }, [leaves]);

  const goTo = useCallback(
    (next: number, how: "forward" | "back") => {
      setDirection(how);
      turned.current = true;
      setPage(next);
      triggerPaperRustle();
    },
    [],
  );

  const turn = useCallback(
    (step: 1 | -1) => {
      const next = page + step;
      if (next >= 0 && next < leaves.length) {
        goTo(next, step === 1 ? "forward" : "back");
        return;
      }
      /* Off the end of the packet: the next record is the next page. */
      const target = step === 1 ? nextRecord : previousRecord;
      if (target) router.push(target.href);
    },
    [goTo, leaves.length, nextRecord, page, previousRecord, router],
  );

  /* Move focus to the leaf after a turn so a screen reader follows the page. */
  useEffect(() => {
    if (!turned.current) return;
    region.current?.focus({ preventScroll: true });
  }, [page]);

  /*
    Arrows turn the packet's pages while a record is open.

    BookKeys binds the same two keys for the book at large, and this runs
    first — the packet is nearer the reader, and inside a record "next page"
    means the next sheet rather than the next record. At the ends it hands
    over: turning forward off the last leaf pushes the next record's route,
    which is the move BookKeys would have made anyway.

    stopPropagation rather than preventDefault alone, so the shared listener
    on `document` does not also act on the same keystroke and skip a record.
  */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        target !== document.body &&
        target !== region.current &&
        target.closest(
          'a[href], button, input, select, textarea, [contenteditable]',
        )
      ) {
        return;
      }

      const step =
        event.key === "ArrowRight" || event.key === "PageDown"
          ? 1
          : event.key === "ArrowLeft" || event.key === "PageUp"
            ? -1
            : 0;
      if (step === 0) return;

      event.preventDefault();
      event.stopPropagation();
      turn(step as 1 | -1);
    };

    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [turn]);

  const leaf = leaves[page];

  return (
    <div className={styles.packet}>
      {/* The packet's own index. Real buttons: §39 wants every physical
          interaction to have a semantic equivalent, and jumping to a sheet is
          one of them. */}
      <nav className={styles.index} aria-label="Record sheets">
        <ol className={styles.indexList}>
          {leaves.map((entry, i) => {
            const open = i === page;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={open ? `${styles.sheetTab} ${styles.sheetTabOpen}` : styles.sheetTab}
                  aria-current={open ? "true" : undefined}
                  onClick={() => goTo(i, i >= page ? "forward" : "back")}
                >
                  <span className={styles.sheetNo}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {entry.label}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div
        ref={region}
        className={styles.leaf}
        data-direction={direction}
        /* Keyed on the sheet so the arrival animation runs again for each —
           "replay per subject, not once per mount". */
        key={leaf.id}
        tabIndex={-1}
        role="group"
        aria-label={`${leaf.label} — ${filing}`}
      >
        {leaf.node}
      </div>

      <div className={styles.foot}>
        <button
          type="button"
          className={styles.turnBtn}
          onClick={() => turn(-1)}
          disabled={page === 0 && !previousRecord}
        >
          <span aria-hidden="true">←</span>
          {page === 0 ? (previousRecord?.label ?? "Start") : "Previous sheet"}
        </button>

        {/* §21: a physical page number, small, not a navigation control. */}
        <p className={styles.folio}>
          {filing} · sheet {page + 1} of {leaves.length}
        </p>

        <button
          type="button"
          className={styles.turnBtn}
          onClick={() => turn(1)}
          disabled={page === leaves.length - 1 && !nextRecord}
        >
          {page === leaves.length - 1
            ? (nextRecord?.label ?? "End")
            : "Next sheet"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
