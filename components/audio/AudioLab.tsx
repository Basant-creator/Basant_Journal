"use client";

import { useState, useSyncExternalStore } from "react";
import {
  heldMusic,
  holdMusic,
  isRunning,
  start,
  stop,
  subscribeRunning,
} from "@/lib/audio/atmosphere";
import type { MusicState } from "@/lib/audio/music";
import styles from "./AudioLab.module.css";

/**
 * The music audition panel.
 *
 * Development only, and kept that way by AudioLabMount rather than by a guard
 * in here — see the note there. This file is never reached by a production
 * build.
 *
 * It exists so somebody can hear the cue in one section and say what is wrong
 * with it. The site on its own is a poor way to do that: the landing plays
 * fourteen seconds of wind before the first note and changes section at
 * forty-six, and each place sets its own. So this does three things the site
 * never does for a visitor:
 *
 *   - starts the air and the cue in one press,
 *   - and holds the music in one section until told otherwise.
 *
 * It used to swap between two cues as well. The Standoff cue was chosen and
 * is the only one the site plays, so there is nothing left to compare.
 *
 * "Let the page decide" releases the hold and the page's own choice resumes.
 */

const SECTIONS: Array<{ id: MusicState; label: string; note: string }> = [
  { id: "silence", label: "Wind only", note: "No music. The environment the cue sits in." },
  { id: "sparse", label: "Sparse", note: "The landing's opening, where a visitor first hears it." },
  { id: "journey", label: "Journey", note: "The landing after 46 seconds, the busiest the cue gets." },
  { id: "reflective", label: "Camp", note: "Camp and the Board. Slower, with more space." },
];

export function AudioLab() {
  const playing = useSyncExternalStore(subscribeRunning, isRunning, () => false);
  /* Seeded from the store rather than assumed, so the panel is right after a
     hot reload has thrown its own state away but not the module's. */
  const [section, setSection] = useState<MusicState | null>(() => heldMusic());

  const chooseSection = (id: MusicState | null) => {
    /*
      A written cue only reads the section on the way in from silence: sparse
      starts at the top and journey at the build, and a move between two
      playing states carries on from wherever the piece has got to. That is
      right for a visitor, and it made Sparse and Journey the same button
      here. So the panel passes through silence first, which lets the score
      go and starts it again where the chosen section says. The landing's own
      behaviour is untouched; this is the audition's choice.
    */
    if (
      isRunning() &&
      id !== null &&
      id !== "silence" &&
      id !== section
    ) {
      holdMusic("silence");
    }
    holdMusic(id);
    setSection(id);
  };

  const play = () => {
    /* Hold first, then start: the rig builds its conductor from the held
       state, so the first thing heard is the section asked for rather than
       fourteen seconds of wind. */
    if (section === null) chooseSection("sparse");
    start();
  };

  const sectionOption = SECTIONS.find((s) => s.id === section);

  return (
    <section className={styles.lab} aria-label="Music audition, development only">
      <header className={styles.head}>
        <p className={styles.label}>Music audition · dev only</p>
        <p className={styles.status} aria-live="polite">
          {playing
            ? `Playing Standoff · ${sectionOption?.label ?? "page timing"}`
            : "Stopped"}
        </p>
      </header>

      <button
        type="button"
        className={styles.play}
        aria-pressed={playing}
        onClick={playing ? stop : play}
      >
        {playing ? "■ Stop" : "▶ Play Standoff"}
      </button>

      <div className={styles.group}>
        <p className={styles.groupLabel}>Section</p>
        <div className={styles.row} role="group" aria-label="Section">
          {SECTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.option}
              aria-pressed={section === option.id}
              title={option.note}
              onClick={() => chooseSection(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={styles.release}
          aria-pressed={section === null}
          onClick={() => chooseSection(null)}
        >
          Let the page decide
        </button>
      </div>

      <p className={styles.hint}>
        {sectionOption?.note ?? "The page's own timing: wind, then sparse at 14 s and journey at 46 s."}
      </p>
    </section>
  );
}
