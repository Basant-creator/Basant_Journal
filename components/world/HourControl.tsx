"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_HOUR,
  type Hour,
  readHour,
  setHour,
  subscribeHour,
} from "@/lib/world/hour";
import styles from "./HourControl.module.css";

/**
 * The control that moves the sun.
 *
 * §13 is explicit that this must not be a sun-and-moon toggle, and the reason
 * is worth stating: a `☀ / 🌙` pair tells the visitor they are choosing a
 * *stylesheet*. What actually happens here is that light crosses a territory,
 * so the control names the two hours and lets the world explain itself.
 *
 * **Two buttons rather than one toggle**, because there are three states and
 * only two of them are destinations. The world rests on the split — both hours
 * on screen at once, divided by the boundary — and from there either choice
 * has to be reachable in one press. A single toggle would force an arbitrary
 * first direction and leave the other hour two presses away, which is a worse
 * answer to a question the visitor has not been asked yet.
 *
 * `aria-pressed` carries the state honestly: at rest neither is pressed, which
 * is true — nothing has been chosen. That is also why the accessible names say
 * what the press *does* rather than what is currently showing.
 *
 * Sits bottom-right rather than beside the sound control. That one is
 * bottom-left, already overlaps the Camp's onward link, and adding a second
 * chip to the same corner would make a known collision worse.
 */
export function HourControl() {
  const hour = useSyncExternalStore(
    subscribeHour,
    readHour,
    () => DEFAULT_HOUR,
  );

  const choose = (next: Hour) => () => setHour(next);

  return (
    /*
      A group rather than a radiogroup. These are not form values — pressing
      one performs an action on the world — and `role="group"` with two
      ordinary buttons is both simpler and more accurate than borrowing radio
      semantics for something that is not a field.
    */
    <div
      className={styles.control}
      data-hour={hour}
      role="group"
      aria-label="Time of day"
    >
      <button
        type="button"
        className={styles.word}
        aria-pressed={hour === "dusk"}
        aria-label="Bring dusk across the frontier"
        onClick={choose("dusk")}
      >
        Dusk
      </button>

      {/* The dial. At rest the sun sits on the boundary itself, between the
          two words, which is the same thing the diagonal is saying on screen. */}
      <span className={styles.track} aria-hidden="true">
        <span className={styles.sun} />
      </span>

      <button
        type="button"
        className={styles.word}
        aria-pressed={hour === "dawn"}
        aria-label="Bring dawn across the frontier"
        onClick={choose("dawn")}
      >
        Dawn
      </button>
    </div>
  );
}
