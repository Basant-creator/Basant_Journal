"use client";

import { useState } from "react";
import { ChapterCard } from "@/components/scene/ChapterCard";
import { LocationTitle } from "@/components/scene/LocationTitle";
import styles from "./TitleBench.module.css";

const CHAPTERS = [
  { chapter: "I", title: "The Camp" },
  { chapter: "II", title: "The Journal" },
];

const PLACES = [
  { title: "The Workshop", subtitle: "Tools of the trade" },
  { title: "The Board", subtitle: "Notable findings" },
  { title: "The Archive", subtitle: "Records of file" },
];

/**
 * Bench for steps 04 and 05.
 *
 * Both components are self-limiting by design — a chapter card plays once per
 * session, a nameplate lasts under two seconds — so judging them needs a way
 * to replay. Each button clears the relevant session key and remounts the
 * component with a fresh id.
 */
export function TitleBench() {
  const [chapter, setChapter] = useState<{ chapter: string; title: string; key: number } | null>(
    null,
  );
  const [place, setPlace] = useState<{ title: string; subtitle: string; key: number } | null>(null);

  const playChapter = (c: (typeof CHAPTERS)[number]) => {
    const key = Date.now();
    try {
      window.sessionStorage.removeItem(`frontier.seen.chapter.bench-${c.chapter}-${key}`);
    } catch {
      /* ignore */
    }
    setChapter({ ...c, key });
  };

  return (
    <div className={styles.bench}>
      {chapter ? (
        <ChapterCard
          key={chapter.key}
          chapter={chapter.chapter}
          title={chapter.title}
          id={`bench-${chapter.chapter}-${chapter.key}`}
        />
      ) : null}

      <section className={styles.group}>
        <div className={styles.head}>
          <h2 className={styles.title}>ChapterCard</h2>
          <p className={styles.role}>The act</p>
        </div>
        <p className={styles.body}>
          Takes the whole viewport and darkens the page behind it. Plays once
          per session, so walking back through a section does not replay it.
          Reserved for Camp and the Journal — a card on every route would be an
          interruption rather than a transition.
        </p>
        <div className={styles.row}>
          {CHAPTERS.map((c) => (
            <button
              key={c.chapter}
              type="button"
              className={styles.button}
              onClick={() => playChapter(c)}
            >
              Play &ldquo;Chapter {c.chapter} · {c.title}&rdquo;
            </button>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.head}>
          <h2 className={styles.title}>LocationTitle</h2>
          <p className={styles.role}>The nameplate</p>
        </div>
        <p className={styles.body}>
          Sits in the page&rsquo;s own header space rather than over the
          viewport, carries no veil, and cannot hide what is under it. It plays
          on every arrival, because a nameplate is useful each time you walk in
          — the way a film names a place each time it cuts back to it.
        </p>
        <div className={styles.row}>
          {PLACES.map((p) => (
            <button
              key={p.title}
              type="button"
              className={styles.button}
              onClick={() => setPlace({ ...p, key: Date.now() })}
            >
              Play &ldquo;{p.title}&rdquo;
            </button>
          ))}
        </div>

        {/* The nameplate needs a positioned parent, exactly as on a real page. */}
        <div className={styles.stage}>
          {place ? (
            <LocationTitle key={place.key} title={place.title} subtitle={place.subtitle} />
          ) : null}
          <div className={styles.under}>
            <p className={styles.underEyebrow}>Gear · Skills</p>
            <p className={styles.underTitle}>Gear</p>
            <p className={styles.underLede}>
              The page&rsquo;s real header, underneath. The nameplate overlays
              it and then fades, leaving this.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
