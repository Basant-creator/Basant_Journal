"use client";

import { type CSSProperties, type ReactNode } from "react";
import styles from "./PaperStack.module.css";

export interface StackSheet {
  id: string;
  content: ReactNode;
}

interface PaperStackProps {
  sheets: StackSheet[];
  /** Which sheet is pulled forward. Null leaves the stack squared up. */
  active?: string | null;
  onSelect?: (id: string) => void;
  label: string;
  className?: string;
}

/**
 * A stack of sheets, one of which can be pulled forward.
 *
 * Depth is carried by four things at once — offset, rotation, scale and a
 * darkening wash — because any one of them alone reads as a design flourish
 * rather than as paper lying on paper. The sheet behind is genuinely dimmer,
 * not just smaller.
 *
 * The sheets are buttons in a tablist, so the stack is operable from the
 * keyboard and announces itself. Nothing about which sheet is on top changes
 * what content exists.
 */
export function PaperStack({
  sheets,
  active,
  onSelect,
  label,
  className,
}: PaperStackProps) {
  const activeIndex = Math.max(
    0,
    sheets.findIndex((s) => s.id === active),
  );

  return (
    <div
      className={[styles.stack, className].filter(Boolean).join(" ")}
      role="tablist"
      aria-label={label}
    >
      {sheets.map((sheet, i) => {
        // Distance from the front sheet drives every depth cue.
        const depth = Math.abs(i - activeIndex);
        const isActive = sheet.id === active;

        return (
          <button
            key={sheet.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            className={isActive ? `${styles.sheet} ${styles.front}` : styles.sheet}
            style={
              {
                "--depth": depth,
                "--lean": `${(i - activeIndex) * 1.4}deg`,
                zIndex: sheets.length - depth,
              } as CSSProperties
            }
            onClick={() => onSelect?.(sheet.id)}
          >
            {sheet.content}
          </button>
        );
      })}
    </div>
  );
}
