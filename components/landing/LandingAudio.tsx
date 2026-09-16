"use client";

import { useEffect } from "react";
import { setHerdAudible, setMusic } from "@/lib/audio/atmosphere";

/**
 * What the landing sounds like, over time.
 *
 * §5 is a progression rather than a mix: the landscape arrives first and the
 * music much later, because the first second of a western that already sounds
 * like a western is a trailer. So this steps through the states instead of
 * setting one —
 *
 *   0s    environment only. Wind, and the occasional bird.
 *   14s   sparse — the banjo appears, with long gaps between phrases.
 *   46s   journey — phrases closer together, and the whistle starts to answer.
 *
 * Fourteen seconds of no music at all is deliberate and is the part most
 * likely to look like a bug. It is §18: a visitor who switches the sound on
 * should hear a place, and only later notice that somebody is playing.
 *
 * Every call here is a no-op while the audio is off, which is almost always —
 * `setMusic` runs against a rig that does not exist and `setHerdAudible` sets
 * a flag nothing reads. So this schedules nothing audible until the visitor
 * has asked for sound, and it does not need to know whether they have.
 */
export function LandingAudio() {
  useEffect(() => {
    /* There are horses on screen here, and nowhere else on the site. */
    setHerdAudible(true);

    const toSparse = window.setTimeout(() => setMusic("sparse"), 14_000);
    const toJourney = window.setTimeout(() => setMusic("journey"), 46_000);

    return () => {
      window.clearTimeout(toSparse);
      window.clearTimeout(toJourney);
      /* Leaving the landing takes the horses and the music with it. §21: the
         landing's music should be gone before the visitor settles anywhere
         else, and Camp gets its own acoustic identity. */
      setHerdAudible(false);
      setMusic("silence");
    };
  }, []);

  return null;
}
