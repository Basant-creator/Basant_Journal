"use client";

import { useState } from "react";
import { PaperStack } from "@/components/world/PaperStack";
import { TornPaper } from "@/components/world/TornPaper";
import { TornPaperTransition } from "@/components/world/TornPaperTransition";
import styles from "./TearBench.module.css";

const SHEETS = [
  { id: "one", title: "Sheet one", note: "The front of the stack." },
  { id: "two", title: "Sheet two", note: "Offset, leaned, scaled and dimmed." },
  { id: "three", title: "Sheet three", note: "Further back again." },
];

/**
 * Step 06's bench: plain surface, torn reveal, second surface.
 *
 * No project content anywhere — the point is to judge the tear itself, which
 * is much harder to do once real copy is competing for attention.
 */
export function TearBench() {
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState("bench-a");
  const [front, setFront] = useState("one");

  return (
    <div className={styles.bench}>
      <section className={styles.group}>
        <div className={styles.head}>
          <h2 className={styles.title}>TornPaperTransition</h2>
          <p className={styles.role}>Cover tears, surface beneath</p>
        </div>

        <div className={styles.controls}>
          <button type="button" className={styles.button} onClick={() => setOpen((v) => !v)}>
            {open ? "Close the sheet" : "Tear it open"}
          </button>
          <button
            type="button"
            className={styles.button}
            onClick={() => setSeed(`bench-${Math.random().toString(36).slice(2, 7)}`)}
          >
            New seam
          </button>
          <p className={styles.readout}>
            seed <strong>{seed}</strong> — every seam is generated, and both
            halves come from the same one
          </p>
        </div>

        <TornPaperTransition
          seed={seed}
          open={open}
          tone="paper"
          className={styles.stage}
          cover={
            <div className={styles.coverInner}>
              <p className={styles.coverTag}>Sealed</p>
              <p className={styles.coverTitle}>The cover sheet</p>
            </div>
          }
        >
          <div className={styles.underneath}>
            <p className={styles.underTag}>Beneath</p>
            <p className={styles.underTitle}>The second surface</p>
            <p className={styles.underBody}>
              This content is in the document from the server and is readable
              the whole time. The cover is a sheet lying on top of it, marked
              aria-hidden, that leaves. Nothing is ever gated behind the tear.
            </p>
          </div>
        </TornPaperTransition>
      </section>

      <section className={styles.group}>
        <div className={styles.head}>
          <h2 className={styles.title}>PaperStack</h2>
          <p className={styles.role}>Sheets lying on sheets</p>
        </div>
        <p className={styles.body}>
          Depth is carried by offset, rotation, scale and a darkening wash at
          once. Any one of them alone reads as a design flourish; together they
          read as paper. The sheets are a tablist, so the stack works from the
          keyboard.
        </p>

        <PaperStack
          label="Test sheets"
          active={front}
          onSelect={setFront}
          className={styles.stack}
          sheets={SHEETS.map((sheet) => ({
            id: sheet.id,
            content: (
              <TornPaper
                seed={`stack-${sheet.id}`}
                edges={["bottom", "right"]}
                tone={sheet.id === front ? "light" : "paper"}
                className={styles.stackSheet}
              >
                <p className={styles.sheetTitle}>{sheet.title}</p>
                <p className={styles.sheetNote}>{sheet.note}</p>
              </TornPaper>
            ),
          }))}
        />
      </section>
    </div>
  );
}
