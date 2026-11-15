"use client";

import { useState } from "react";
import { triggerPaperRustle } from "@/lib/audio/atmosphere";
import { Shot } from "./Shot";
import styles from "./cards.module.css";

export type Deed = { title: string; by: string | null; period: string; kind: string; proof: string | null; detail: string | null };

/**
 * The papers, kept in a stack on the desk under the lamp: each on its own
 * aged sheet, deckle-edged, foxed at the corners, tied across with a ribbon
 * and sealed where there is a certificate to show. Choose a paper's tab to
 * draw it to the top; the rest fall back in order behind it.
 */
export function Deeds({ deeds }: { deeds: Deed[] }) {
  const [top, setTop] = useState(0);
  const n = deeds.length;
  const bring = (i: number) => {
    if (i === top) return;
    triggerPaperRustle();
    setTop(i);
  };

  return (
    <Shot className={styles.deedScene} light="62% 10%">
      <span className={styles.deedDesk} aria-hidden="true" />
      <div className={styles.deeds}>
        <div className={styles.deedTabs} role="tablist" aria-label="Papers">
          {deeds.map((d, i) => (
            <button key={d.title} type="button" role="tab" aria-selected={top === i} onClick={() => bring(i)}>
              {d.kind}
              <span className={styles.deedTabName}>{d.title}</span>
            </button>
          ))}
        </div>
        <div className={styles.deedStack}>
          {deeds.map((d, i) => {
            const depth = (i - top + n) % n;
            return (
              <article
                key={d.title}
                className={styles.deed}
                role="tabpanel"
                aria-hidden={depth !== 0}
                data-top={depth === 0 ? "" : undefined}
                style={{ "--depth": depth, zIndex: n - depth } as React.CSSProperties}
                onClick={() => bring(i)}
              >
                <div className={styles.deedPaper}>
                  <span className={styles.deedAge} aria-hidden="true" />
                  <p className={styles.deedKind}>{d.kind}</p>
                  <h4 className={styles.deedTitle}>{d.title}</h4>
                  {d.by ? <p className={styles.deedBy}>{d.by}</p> : null}
                  <p className={styles.deedPeriod}>{d.period}</p>
                  {d.detail ? <p className={styles.deedDetail}>{d.detail}</p> : null}
                  {d.proof ? (
                    <a className={styles.deedProof} href={d.proof} target="_blank" rel="noreferrer noopener" tabIndex={depth === 0 ? 0 : -1}>
                      <span className={styles.seal} aria-hidden="true" />
                      See the certificate
                    </a>
                  ) : null}
                </div>
                <span className={styles.ribbon} aria-hidden="true" />
              </article>
            );
          })}
        </div>
      </div>
    </Shot>
  );
}
