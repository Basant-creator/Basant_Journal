"use client";

import { useEffect } from "react";
import { isRunning, onStart, setMusic } from "@/lib/audio/atmosphere";

/**
 * What the landing sounds like, over time.
 *
 * §5 is a progression rather than a mix: the landscape arrives first and the
 * music much later, because the first second of a western that already sounds
 * like a western is a trailer. So this steps through the states instead of
 * setting one —
 *
 *   0s    environment only. Wind, and the occasional bird.
 *   14s   sparse — the guitar appears, with long gaps between phrases.
 *   46s   journey — phrases closer together, and the whistle answers more often.
 *
 * Fourteen seconds of no music at all is deliberate and is the part most
 * likely to look like a bug. It is §18: a visitor who switches the sound on
 * should hear a place, and only later notice that somebody is playing.
 *
 * **The clock starts when the sound does, not when the page does.** That is
 * what `onStart` is for, and it is not a detail: almost nobody presses the
 * control in the first fourteen seconds. Timing the progression from mount
 * meant that anyone who looked around first and then asked for sound walked
 * in on a phrase already running — or, once the timers had both fired, got
 * `journey` from the first note with no landscape in front of it. The quiet
 * opening was reliably delivered to the one visitor who never heard it.
 */
export function LandingAudio() {
  useEffect(() => {
    let timers: number[] = [];

    const begin = () => {
      for (const id of timers) window.clearTimeout(id);
      timers = [
        window.setTimeout(() => setMusic("sparse"), 14_000),
        window.setTimeout(() => setMusic("journey"), 46_000),
      ];
      /* Back to the top: switching the air off and on again is a request to
         hear the place from the beginning, not to resume where it left off. */
      setMusic("silence");
    };

    /* Already playing when the landing mounts — a visitor arriving back here
       with the sound on gets the progression again, which is right: this is
       the establishing shot wherever it appears in the journey. */
    if (isRunning()) begin();
    const stopListening = onStart(begin);

    return () => {
      stopListening();
      for (const id of timers) window.clearTimeout(id);
      /* Leaving the landing takes its music with it: §21 wants it gone before
         the visitor settles anywhere else, and Camp has its own identity. */
      setMusic("silence");
    };
  }, []);

  return null;
}
