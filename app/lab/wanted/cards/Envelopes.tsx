"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { triggerPaperRustle } from "@/lib/audio/atmosphere";
import { Shot } from "./Shot";
import styles from "./envelopes.module.css";

export type Wire = { no: string; year: string; re: string; body: string; sign: string };

const OPEN_BEAT_MS = 900;

/**
 * The journey as telegrams, delivered. Each year's wire arrives sealed in
 * its envelope, laid on a desk under the lamp. When the desk comes into view
 * they are opened in turn: the flap lifts and the form is drawn up out of
 * the envelope to be read. Tap an envelope to slide its telegram back in,
 * and again to draw it out.
 *
 * With reduced motion the telegrams are simply out of their envelopes.
 */
export function Envelopes({ wires }: { wires: Wire[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const timers = useRef<number[]>([]);

  const deliver = useCallback(() => {
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "still";
    if (still) {
      setOpen(new Set(wires.map((_, i) => i)));
      return;
    }
    wires.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => {
          triggerPaperRustle();
          setOpen((prev) => new Set(prev).add(i));
        }, 400 + i * OPEN_BEAT_MS),
      );
    });
  }, [wires]);

  const toggle = (i: number) => {
    triggerPaperRustle();
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <Shot className={styles.scene} light="50% 0%" onSeen={deliver}>
      <span className={styles.desk} aria-hidden="true" />
      <ol className={styles.posts}>
        {wires.map((w, i) => (
          <li key={w.no} className={styles.post} style={{ "--i": i } as CSSProperties} data-open={open.has(i) ? "" : undefined}>
            <button
              type="button"
              className={styles.envelope}
              aria-expanded={open.has(i)}
              aria-label={`Telegram ${w.no}, ${w.year}: ${w.re}. ${open.has(i) ? "Slide it back into its envelope" : "Open the envelope"}`}
              onClick={() => toggle(i)}
            >
              <span className={styles.inside} aria-hidden="true" />

              {/* The telegram, inside the envelope until it is drawn out. */}
              <span className={styles.well}>
                <span className={styles.wire}>
                  <span className={styles.wireHead}>
                    <span className={styles.wireTitle}>Telegram</span>
                    <span className={styles.wireCo}>The Frontier Telegraph</span>
                  </span>
                  <span className={styles.fields}>
                    <span>
                      <em>No.</em> {w.no}
                    </span>
                    <span>
                      <em>Year</em> {w.year}
                    </span>
                    <span>
                      <em>Re</em> {w.re}
                    </span>
                  </span>
                  <span className={styles.wireBody}>{w.body}</span>
                  <span className={styles.wireSign}>{w.sign}</span>
                </span>
              </span>

              <span className={styles.pocket} aria-hidden="true">
                <span className={styles.stamp}>
                  <span>{w.year}</span>
                </span>
                <span className={styles.postmark} />
                <span className={styles.printed}>Telegram</span>
                <span className={styles.address}>
                  No. {w.no}
                  <br />
                  Re: {w.re}
                </span>
              </span>
              <span className={styles.flap} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
    </Shot>
  );
}
