"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_HOUR,
  readHour,
  subscribeHour,
  toggleHour,
} from "@/lib/world/hour";
import styles from "./HourControl.module.css";

/**
 * The control that moves the sun.
 *
 * §13 is explicit that this must not be a sun-and-moon toggle, and the reason
 * is worth stating: a `☀ / 🌙` pair tells the visitor they are choosing a
 * *stylesheet*. What actually happens here is that the light crosses a
 * territory, so the control names the two hours and lets the world explain
 * itself.
 *
 * It is an ordinary button (§38). The accessible name says what pressing it
 * will do rather than what is currently true — "Switch to dawn atmosphere" —
 * because a toggle whose label describes its state leaves a screen-reader
 * user guessing which way the press goes. `aria-pressed` is deliberately
 * *not* used: this is not a thing being turned on, it is a choice between two
 * equals, and "pressed: false" would imply dusk is the absence of something.
 *
 * Sits bottom-right rather than beside the sound control. That control is
 * bottom-left, already overlaps the Camp's onward link, and adding a second
 * chip to the same corner would make a known collision worse.
 */
export function HourControl() {
  const hour = useSyncExternalStore(
    subscribeHour,
    readHour,
    () => DEFAULT_HOUR,
  );

  const next = hour === "dusk" ? "dawn" : "dusk";

  return (
    <button
      type="button"
      className={styles.control}
      data-hour={hour}
      onClick={() => toggleHour()}
      aria-label={`Switch to ${next} atmosphere`}
    >
      {/*
        Both words are always present, which is what makes this read as a
        position on a dial rather than a lamp. The inactive one is dimmed, not
        hidden — a label that disappears takes its own meaning with it, and
        the visitor loses the fact that there are exactly two hours.
      */}
      <span className={styles.word} data-active={hour === "dusk"}>
        Dusk
      </span>
      <span className={styles.track} aria-hidden="true">
        <span className={styles.sun} />
      </span>
      <span className={styles.word} data-active={hour === "dawn"}>
        Dawn
      </span>
    </button>
  );
}
