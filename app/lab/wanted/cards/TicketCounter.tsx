"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { triggerCardDeal } from "@/lib/audio/atmosphere";
import { Shot } from "./Shot";
import styles from "./counter.module.css";

export type Ticket = { year: string; title: string; body: string; leg: string };

const ISSUE_BEAT_MS = 950;

/**
 * The journey, issued at a ticket window: a station booth in a plank wall,
 * its window barred, a lamp lit inside, and under the glass the half-moon
 * slot the clerk pushes tickets through. When the booth comes into view the
 * tickets are issued one leg at a time, slid out through the slot onto the
 * counter, where they lie fanned. Tap one to pick it up and turn it over:
 * on the back is what happened on that leg. Tap it again to put it down.
 *
 * With reduced motion they are simply lying on the counter.
 */
export function TicketCounter({ tickets }: { tickets: Ticket[] }) {
  const [issued, setIssued] = useState(false);
  const [held, setHeld] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const issue = useCallback(() => {
    setIssued(true);
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "still";
    if (still) return;
    tickets.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => triggerCardDeal(), i * ISSUE_BEAT_MS + 300));
    });
  }, [tickets]);

  return (
    <Shot className={styles.scene} light="30% 10%" onSeen={issue}>
      <div className={styles.wall} aria-hidden="true">
        <div className={styles.sign}>
          <span className={styles.signText}>Tickets</span>
          <span className={styles.signSmall}>The Frontier Line</span>
        </div>
        <div className={styles.booth}>
          <span className={styles.inside}>
            <span className={styles.clerk} />
          </span>
          <span className={styles.bars} />
          <span className={styles.glare} />
          <span className={styles.slot} />
        </div>
        <span className={styles.lamp} />
      </div>

      <div className={styles.counter} aria-hidden="true">
        <span className={styles.counterTop} />
        <span className={styles.counterEdge} />
        <span className={styles.counterFront} />
      </div>

      <ol className={styles.tickets} data-issued={issued ? "" : undefined} data-holding={held !== null ? "" : undefined}>
        {tickets.map((t, i) => (
          <li key={t.year} className={styles.slotFor} style={{ "--i": i } as CSSProperties}>
            <button
              type="button"
              className={styles.ticket}
              data-held={held === i ? "" : undefined}
              aria-pressed={held === i}
              aria-label={`${t.year}, ${t.title}. ${held === i ? "Put it down" : "Pick it up and turn it over"}`}
              onClick={() => setHeld((h) => (h === i ? null : i))}
            >
              <span className={styles.flip}>
                <span className={styles.face}>
                  <span className={styles.stub}>
                    <span className={styles.admit}>Admit one</span>
                    <span className={styles.year}>{t.year}</span>
                    <span className={styles.serial}>No. {String(i + 1).padStart(4, "0")}</span>
                  </span>
                  <span className={styles.main}>
                    <span className={styles.line}>The Frontier Line · {t.leg}</span>
                    <span className={styles.title}>{t.title}</span>
                    <span className={styles.hint}>Turn over</span>
                  </span>
                </span>
                <span className={styles.back}>
                  <span className={styles.line}>
                    {t.leg} · {t.year}
                  </span>
                  <span className={styles.body}>{t.body}</span>
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </Shot>
  );
}
