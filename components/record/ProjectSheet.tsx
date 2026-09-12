import type { ReactNode } from "react";
import { Paper, type PaperVariant } from "@/components/paper/Paper";
import styles from "./ProjectSheet.module.css";

interface ProjectSheetProps {
  children: ReactNode;
  /** Fragment id. A record's sections are addressable; see the routing contract. */
  id: string;
  heading: string;
  /** Which stock this record is filed on. Set once per project, not per sheet. */
  variant?: PaperVariant;
  /** "2 of 6", printed in the corner the way a real sheet is numbered. */
  sheet?: string;
  /** Torn seed. Omit for a cut sheet; each sheet needs its own. */
  seed?: string;
  /**
   * `plain` drops the paper and keeps everything else.
   *
   * Not every section of a record is written on a sheet — a panel of
   * instruments is mounted, not written — but every section is still an
   * addressable, headed, numbered part of the same document.
   */
  surface?: "paper" | "plain";
  className?: string;
}

/**
 * One sheet of a field record.
 *
 * The unit the whole document system is built from: an addressable section, a
 * heading that names it, and a piece of paper the content sits on. Everything
 * about what that paper *is* comes from the stock — `variant` — which is set
 * once per project rather than per section, because a record filed on manila
 * is filed on manila all the way through.
 *
 * The section wrapper is not decoration. A record is one long document with
 * fragment anchors rather than a route per section, so every sheet has to be
 * a real landmark with a real id and a heading bound to it.
 */
export function ProjectSheet({
  children,
  id,
  heading,
  variant = "FIELD_NOTE",
  sheet,
  seed,
  surface = "paper",
  className,
}: ProjectSheetProps) {
  return (
    <section
      id={id}
      className={[styles.section, className].filter(Boolean).join(" ")}
      aria-labelledby={`${id}-heading`}
    >
      <div className={styles.head}>
        <h2 id={`${id}-heading`} className={styles.heading}>
          {heading}
        </h2>
        {sheet ? <p className={styles.sheetNumber}>Sheet {sheet}</p> : null}
      </div>

      {surface === "plain" ? (
        children
      ) : (
        <Paper
          variant={variant}
          edges={seed ? ["right"] : undefined}
          seed={seed}
          className={styles.paper}
        >
          {children}
        </Paper>
      )}
    </section>
  );
}
