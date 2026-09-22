"use client";

import { useState } from "react";
import { currentCue, setCue } from "@/lib/audio/atmosphere";
import type { CueName } from "@/lib/audio/music";
import styles from "./AudioLab.module.css";

/**
 * The A/B switch for the landing's music.
 *
 * Development only, and kept that way by AudioLabMount rather than by a guard
 * in here — see the note there. This file is never reached by a production
 * build, which is why it can be as plain as it likes.
 *
 * Deliberately ugly. It is a bench instrument sitting on top of a composition
 * that took some care, and making it look like it belongs would be the first
 * step toward somebody deciding it should ship.
 *
 * It switches the piece and nothing else — not the state, not the volume, not
 * the progression. Comparing two cues means hearing both do the same thing at
 * the same point in the same landscape, so everything except the notes has to
 * stay where it is.
 */

const CUES: Array<{ id: CueName; label: string; note: string }> = [
  { id: "frontier", label: "Frontier", note: "84 BPM · guitar, whistle, reed · phrase and rest" },
  { id: "lofi", label: "Lo-fi", note: "72 BPM · pulse, bass, chords, tape · continuous bed" },
];

export function AudioLab() {
  /* Seeded from the store rather than assumed, so the panel is right after a
     hot reload has thrown its own state away but not the module's. */
  const [chosen, setChosen] = useState<CueName>(() => currentCue());

  return (
    <div className={styles.lab}>
      <p className={styles.label}>Landing cue · dev</p>
      <div className={styles.row} role="group" aria-label="Landing music cue">
        {CUES.map((option) => (
          <button
            key={option.id}
            type="button"
            className={styles.option}
            aria-pressed={chosen === option.id}
            title={option.note}
            onClick={() => {
              setCue(option.id);
              setChosen(option.id);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
