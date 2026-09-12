"use client";

import { type ReactNode, useEffect, useState } from "react";
import type { RecordEntryKind } from "@/lib/record/identity";
import styles from "./RecordEntry.module.css";

interface RecordEntryProps {
  children: ReactNode;
  kind: RecordEntryKind;
  /** Changes per record, so arriving at a sibling replays the arrival. */
  recordId: string;
  className?: string;
}

/**
 * How a record arrives.
 *
 * A sheet is pulled forward, a file is drawn out of a stack, a blueprint is
 * unfolded. Each motion belongs to the stock it happens to — which is the
 * difference between an entry animation and a physical one.
 *
 * Three rules, and the first is the one that matters most here:
 *
 *   1. **It never delays navigation.** The route changes when the router says
 *      so; this plays over a document that is already there. Nothing waits
 *      for it and nothing is gated behind it.
 *   2. **The resting state is the visible one.** The animation runs *from* an
 *      offset toward normal with `animation-fill-mode: both`, so a browser
 *      that never runs it shows a finished document rather than an empty one.
 *      That is why the state is applied after mount and keyed on an
 *      attribute: the server's HTML carries no state and matches no rule.
 *   3. **Once per record.** `recordId` is the key, so walking TuneIt →
 *      OnSight replays it for the new document rather than suppressing it —
 *      the failure this codebase has already made once, in the chapter cards.
 */
export function RecordEntry({ children, kind, recordId, className }: RecordEntryProps) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setPlaying(true);
    const id = window.setTimeout(() => setPlaying(false), 900);
    return () => {
      window.clearTimeout(id);
      setPlaying(false);
    };
  }, [recordId]);

  return (
    <div
      className={[styles.entry, className].filter(Boolean).join(" ")}
      data-kind={playing ? kind : undefined}
    >
      {children}
    </div>
  );
}
