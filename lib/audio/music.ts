import type { Desk } from "./buses";
import { type Sustained, bow, pluck, whistle } from "./instruments";

/**
 * The Frontier motif.
 *
 * Original, and deliberately so. §10 forbids reproducing any existing western
 * soundtrack's melody, harmony or arrangement, and §42 asks instead for
 * something with a stated shape: sparse banjo, a human whistle, 70–100 BPM,
 * open fifths, major/minor ambiguity, and real pauses. What is written below
 * is that brief and nothing else — no transcription, no quotation.
 *
 * The ambiguity is in the note set. D–F–G–A–C is D minor pentatonic, but the
 * banjo's drone alternates D and A — a bare fifth with no third in it — so the
 * mode is only decided by whichever note the whistle happens to land on. That
 * is the "open, unresolved" quality the brief asks for, and it costs one
 * missing note rather than a modulation scheme.
 *
 * Scheduled with a look-ahead rather than by `setTimeout` per note. A timer is
 * accurate to a frame at best; an AudioParam scheduled against
 * `context.currentTime` is accurate to a sample, which is the difference
 * between a phrase and a stumble.
 */

/** Hz. D minor pentatonic across two octaves, plus the drone's fifth. */
const NOTES = {
  /* The drone's two notes, an octave below the banjo's lowest. */
  D2: 73.42,
  A2: 110.0,
  D3: 146.83,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  C4: 261.63,
  D4: 293.66,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
} as const;

/** 84 BPM. Walking pace, which is the pace of the thing on screen. */
const BEAT = 60 / 84;

/**
 * What the music is doing.
 *
 * §11's states, named for what they are rather than for a section number.
 * `SILENCE` is a real state and not the absence of one — §18 is explicit that
 * the quiet is part of the design.
 */
export type MusicState = "silence" | "sparse" | "journey" | "reflective";

interface Phrase {
  /** Beats from the phrase's start, and the note at each. */
  notes: Array<{ at: number; note: number; level: number; pan: number }>;
  /** Beats the whole phrase occupies, including its tail of rest. */
  beats: number;
}

/*
  Four banjo phrases, and the rests inside them are as composed as the notes.

  Each is a drone on the low string with a figure over it — the clawhammer
  shape, where the thumb keeps a pulse and the fingers carry the tune. None of
  them fills its own length: every phrase ends with at least two beats of
  nothing, which is what stops a loop sounding like a loop.
*/
const BANJO: Phrase[] = [
  {
    beats: 8,
    notes: [
      { at: 0, note: NOTES.D3, level: 0.5, pan: -0.15 },
      { at: 1.5, note: NOTES.A3, level: 0.32, pan: 0.1 },
      { at: 2, note: NOTES.D4, level: 0.4, pan: 0.05 },
      { at: 3, note: NOTES.C4, level: 0.3, pan: -0.05 },
      { at: 4, note: NOTES.A3, level: 0.38, pan: 0.12 },
      { at: 5.5, note: NOTES.G3, level: 0.26, pan: -0.1 },
    ],
  },
  {
    beats: 8,
    notes: [
      { at: 0, note: NOTES.D3, level: 0.46, pan: -0.15 },
      { at: 1, note: NOTES.F4, level: 0.34, pan: 0.14 },
      { at: 1.75, note: NOTES.D4, level: 0.28, pan: 0.02 },
      { at: 3, note: NOTES.A3, level: 0.36, pan: -0.08 },
      { at: 4.5, note: NOTES.C4, level: 0.24, pan: 0.1 },
    ],
  },
  {
    beats: 6,
    notes: [
      { at: 0, note: NOTES.A3, level: 0.42, pan: 0.08 },
      { at: 1.5, note: NOTES.D4, level: 0.3, pan: -0.06 },
      { at: 2.5, note: NOTES.G3, level: 0.34, pan: 0.12 },
      { at: 3, note: NOTES.D3, level: 0.44, pan: -0.15 },
    ],
  },
  {
    /* The sparest of the four. Used most when the music is receding. */
    beats: 8,
    notes: [
      { at: 0, note: NOTES.D3, level: 0.4, pan: -0.12 },
      { at: 2.5, note: NOTES.A3, level: 0.3, pan: 0.1 },
      { at: 5, note: NOTES.D4, level: 0.26, pan: 0 },
    ],
  },
];

/*
  Whistle phrases: three of them, all short.

  §8 asks for the whistle to be much rarer than the banjo, to sit in long gaps
  and to disappear entirely at times. It is a person somewhere in the
  landscape, and a person does not whistle continuously.
*/
const WHISTLES: Array<Array<{ at: number; note: number; hold: number }>> = [
  [
    { at: 0, note: NOTES.A4, hold: 1.2 },
    { at: 1.5, note: NOTES.G4, hold: 0.8 },
    { at: 2.5, note: NOTES.D4, hold: 1.8 },
  ],
  [
    { at: 0, note: NOTES.D5, hold: 0.9 },
    { at: 1, note: NOTES.C5, hold: 0.7 },
    { at: 2, note: NOTES.A4, hold: 2.2 },
  ],
  [
    { at: 0, note: NOTES.F4, hold: 1.4 },
    { at: 2, note: NOTES.A4, hold: 2.4 },
  ],
];

/**
 * How often a phrase is followed by a whistle, per state.
 *
 * `sparse` used to be 0, which meant the whistle could not arrive until
 * `journey` did — forty-six seconds into the landing. That was defensible when
 * the whistle was a detail and wrong once it became a lead: the visitor most
 * likely to never hear it is the one who looks around for half a minute and
 * moves on, which is most of them. It now answers about one phrase in five
 * from the moment there is any music at all.
 */
const WHISTLE_CHANCE: Record<MusicState, number> = {
  silence: 0,
  sparse: 0.22,
  journey: 0.34,
  reflective: 0.18,
};

/** How much of a gap follows each phrase, in beats, per state. */
const REST: Record<MusicState, [number, number]> = {
  silence: [0, 0],
  sparse: [6, 12],
  journey: [2, 6],
  reflective: [8, 16],
};

export interface Conductor {
  setState(next: MusicState): void;
  stop(): void;
}

/**
 * Starts the music and returns the handle that steers it.
 *
 * The scheduler wakes four times a second and fills a two-second window with
 * anything due. That is the standard Web Audio pattern and it exists because
 * the alternative — a timer per note — drifts audibly within a few bars.
 */
export function conduct(desk: Desk, initial: MusicState = "silence"): Conductor {
  const { context } = desk;
  let state: MusicState = initial;
  /* Where the next phrase begins, in context time. */
  let cursor = context.currentTime + 0.4;
  /* Phrases since the last whistle, so it cannot arrive twice in a row. */
  let sinceWhistle = 0;
  let index = Math.floor(Math.random() * BANJO.length);

  /*
    The drone runs on its own clock.

    It has nothing to do with the phrase cursor and must not: the banjo rests
    for up to sixteen beats at a time, and a bed that stopped during the rests
    would be a bed nobody could hear the point of. So it is scheduled by the
    same look-ahead, overlapping itself, and the banjo plays over whatever it
    happens to be holding.
  */
  let droneCursor = context.currentTime + 0.4;
  let droneRoot = 0;
  let drones: Sustained[] = [];

  const LOOKAHEAD = 2;
  /* Each drone overlaps the next by more than its release, so the handover is
     a crossfade and never a gap. */
  const DRONE_OVERLAP = 4;

  const hushDrones = (seconds = 1.6) => {
    for (const drone of drones) drone.release(seconds);
    drones = [];
  };

  const schedule = () => {
    if (state === "silence") {
      /* Keep the cursors with the clock, so leaving silence does not dump a
         backlog of phrases into the present all at once. */
      cursor = Math.max(cursor, context.currentTime + 0.4);
      droneCursor = Math.max(droneCursor, context.currentTime + 0.4);
      return;
    }

    /* The bed, first, so the banjo has something to land on. */
    while (droneCursor < context.currentTime + LOOKAHEAD) {
      const length = 15 + Math.random() * 6;
      /* D and A alternating: the bare fifth is in the drone itself, which is
         where the mode's ambiguity comes from. */
      droneRoot = (droneRoot + 1) % 2;
      drones.push(
        bow(context, desk.bus.music, {
          frequency: droneRoot === 0 ? NOTES.D2 : NOTES.A2,
          duration: length,
          level: state === "reflective" ? 0.11 : 0.15,
          pan: (Math.random() - 0.5) * 0.3,
          when: droneCursor,
        }),
      );
      droneCursor += length - DRONE_OVERLAP;
      /* Anything older than the overlap has already released itself. */
      if (drones.length > 3) drones = drones.slice(-3);
    }

    while (cursor < context.currentTime + LOOKAHEAD) {
      /* Never the same phrase twice running: the repetition a listener
         notices is adjacency, not recurrence. */
      let next = Math.floor(Math.random() * BANJO.length);
      if (next === index) next = (next + 1) % BANJO.length;
      index = next;
      const phrase = BANJO[index];

      /* Reflective leans on the sparest phrase; journey avoids it. */
      const chosen =
        state === "reflective" && Math.random() < 0.5 ? BANJO[3] : phrase;

      for (const n of chosen.notes) {
        pluck(context, desk.bus.music, {
          frequency: n.note,
          decay: 1.6 + Math.random() * 0.5,
          /* A hand is never even. This is the difference between a player and
             a sequencer, and it is worth more than any amount of reverb. */
          attack: n.level * (0.85 + Math.random() * 0.3),
          level: n.level * (0.9 + Math.random() * 0.2),
          pan: n.pan,
          when: cursor + n.at * BEAT + (Math.random() - 0.5) * 0.018,
        });
      }

      const phraseEnd = cursor + chosen.beats * BEAT;

      /* The whistle answers the banjo rather than sitting on top of it: it
         enters after the phrase, in the gap. */
      sinceWhistle += 1;
      if (sinceWhistle >= 2 && Math.random() < WHISTLE_CHANCE[state]) {
        sinceWhistle = 0;
        const line = WHISTLES[Math.floor(Math.random() * WHISTLES.length)];
        const pan = (Math.random() - 0.5) * 0.4;
        for (const n of line) {
          whistle(context, desk.bus.music, {
            frequency: n.note,
            duration: n.hold,
            /* Raised with the music bus, and then a little further. A held
               tone carries further than a pluck of the same peak, so this
               reads *above* the banjo at a number below its loudest note —
               which is what a person whistling over an instrument does. */
            level: 0.36,
            pan,
            when: phraseEnd + n.at * BEAT + 0.3,
          });
        }
      }

      const [restMin, restMax] = REST[state];
      cursor = phraseEnd + (restMin + Math.random() * (restMax - restMin)) * BEAT;
    }
  };

  schedule();
  const timer = window.setInterval(schedule, 250);

  return {
    setState(next) {
      if (next === state) return;
      state = next;
      /* §21: the landing's music has to be gone before the visitor settles
         anywhere else. A drone holds for twenty seconds, so silence has to
         actually take it away rather than just stop scheduling more. */
      if (next === "silence") hushDrones();
    },
    stop() {
      window.clearInterval(timer);
      state = "silence";
      hushDrones(0.9);
    },
  };
}
