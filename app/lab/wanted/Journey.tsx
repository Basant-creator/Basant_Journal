"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { JourneyTrail, Milestone } from "./cards/journey";
import { TrailScene } from "./cards/TrailScene";
import styles from "./journey.module.css";

/* Where there is room for the trail and the record side by side. */
const SIDE_BY_SIDE = "(min-width: 1100px)";

/**
 * One checkpoint's record, as the kind of paper it is. A year is a survey
 * marker set in the ground; schooling is a dated record; training and
 * certificates are slips with their proof attached; what was built is a
 * stamped field record with the way to its case. Every word is the
 * content file's.
 */
function Record({ m }: { m: Milestone }) {
  switch (m.type) {
    case "year":
      return (
        <div className={styles.marker}>
          <p className={styles.markerYear}>{m.year}</p>
          <h3 className={styles.markerTitle}>{m.title}</h3>
          <p className={styles.markerBody}>{m.body}</p>
        </div>
      );
    case "school":
      return (
        <article className={styles.slip} data-kind="school">
          <p className={styles.slipKind}>Record · Schooling</p>
          <h4 className={styles.slipTitle}>{m.qualification}</h4>
          <p className={styles.slipMeta}>
            {m.institution}, {m.place}
          </p>
          <p className={styles.slipDate}>{m.period}</p>
        </article>
      );
    case "training":
    case "certificate":
      return (
        <article className={styles.slip} data-kind="paper">
          <p className={styles.slipKind}>{m.type === "training" ? "Training" : "Certificate"}</p>
          <h4 className={styles.slipTitle}>{m.title}</h4>
          {m.issuer ? <p className={styles.slipMeta}>{m.issuer}</p> : null}
          {m.type === "training" && m.body ? <p className={styles.slipBody}>{m.body}</p> : null}
          <p className={styles.slipDate}>{m.period}</p>
          {m.proof ? (
            <a className={styles.slipLink} href={m.proof} target="_blank" rel="noreferrer noopener" aria-describedby="new-tab">
              See the certificate
            </a>
          ) : null}
        </article>
      );
    case "built":
      return (
        <article className={styles.slip} data-kind="built">
          <p className={styles.slipStamp} aria-hidden="true">
            Built
          </p>
          <p className={styles.slipKind}>Field record</p>
          <h4 className={styles.slipTitle}>{m.title}</h4>
          <p className={styles.slipMeta}>{m.subtitle}</p>
          <p className={styles.slipDate}>{m.period}</p>
          <Link className={styles.slipLink} href={m.route}>
            Read the case
          </Link>
        </article>
      );
  }
}

/**
 * The journey: the trail across open country, and beside it the record of
 * every checkpoint on it, in order, to be read.
 *
 * Side by side, the trail holds its place while the record scrolls past
 * it, and the walker goes to whichever checkpoint is being read, the one
 * whose record is across the middle of the screen: the walk is the
 * reading, not a clock and not a share of the scroll. A lantern beside
 * that record marks it. Narrower, the trail comes first and walks itself,
 * and the record follows, every word of it.
 */
export function Journey({ trail }: { trail: JourneyTrail }) {
  const list = useRef<HTMLOListElement>(null);
  /* Undecided on the server and in the hydration render: the trail walks
     itself until the browser says there is room to lead it. */
  const [led, setLed] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setLed(window.matchMedia(SIDE_BY_SIDE).matches);
  }, []);

  useEffect(() => {
    const el = list.current;
    if (!led || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { root: el.closest("[data-world]"), rootMargin: "-45% 0px -50% 0px" },
    );
    el.querySelectorAll("[data-index]").forEach((item) => io.observe(item));
    return () => io.disconnect();
  }, [led]);

  return (
    <div className={styles.journey} data-led={led ? "" : undefined}>
      <div className={styles.sceneCol}>
        <div className={styles.sticky}>
          <TrailScene trail={trail} active={led ? active : null} contained />
        </div>
      </div>
      <ol ref={list} className={styles.records}>
        {trail.nodes.map((n, i) => (
          <li
            key={i}
            className={styles.record}
            data-index={i}
            data-enter=""
            data-kind={n.record.type}
            data-active={led && active === i ? "" : undefined}
            style={{ "--n": i } as CSSProperties}
          >
            <Record m={n.record} />
          </li>
        ))}
      </ol>
    </div>
  );
}
