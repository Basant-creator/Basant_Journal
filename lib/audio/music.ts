import type { Desk } from "./buses";
import { type Sustained, bow, guitar, pluck, whistle } from "./instruments";

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
  /* The whistle's octave. People whistle high — roughly 700 Hz to 2 kHz — and
     putting it up here is both the truthful range and the reason it can be
     picked out at all: it is the only voice above the banjo's top string. */
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  D6: 1174.66,
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
    { at: 0, note: NOTES.A5, hold: 1.2 },
    { at: 1.5, note: NOTES.G5, hold: 0.8 },
    { at: 2.5, note: NOTES.D5, hold: 1.8 },
  ],
  [
    { at: 0, note: NOTES.D6, hold: 0.9 },
    { at: 1, note: NOTES.C6, hold: 0.7 },
    { at: 2, note: NOTES.A5, hold: 2.2 },
  ],
  [
    { at: 0, note: NOTES.F5, hold: 1.4 },
    { at: 2, note: NOTES.A5, hold: 2.4 },
  ],
];

/*
  Guitar voicings: broken chords in the same five notes.

  Each is a shape rather than a harmony. There is no third anywhere in the set
  — D, F, G, A, C with the F only ever appearing on top — so these are
  stacks of fourths and fifths with one colour note, which is what keeps the
  mode as undecided as the drone does. A voicing that named itself major or
  minor would resolve the whole piece by accident.

  Four notes each, rolled rather than strummed: a thumb and three fingers, not
  a pick dragged across the strings.
*/
const GUITAR: number[][] = [
  [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],
  [NOTES.G3, NOTES.D4, NOTES.G4, NOTES.C5],
  [NOTES.A3, NOTES.C4, NOTES.G4, NOTES.D5],
];

/** Beats into the roll for each of the four notes. A thumb, then fingers. */
const ROLL = [0, 0.62, 1.24, 1.95];

/**
 * How often the guitar answers, per state.
 *
 * It plays in the gap after a banjo phrase rather than underneath one. The
 * banjo is the rhythm and the guitar is the reply, and two plucked
 * instruments sounding at once is just a thicker banjo — the whole reason
 * this reads as a second instrument is that it is heard on its own.
 */
const GUITAR_CHANCE: Record<MusicState, number> = {
  silence: 0,
  sparse: 0.5,
  journey: 0.62,
  reflective: 0.42,
};

/**
 * How often a phrase is followed by a whistle, per state.
 *
 * These have been raised twice, and the second time was measured rather than
 * argued. §8 asks for the whistle to be much rarer than the banjo, and taken
 * literally that produced a voice nobody ever heard: in `sparse` a phrase and
 * its rest run nine to fourteen seconds, the gate below wanted two phrases
 * between whistles, and the chance was 0.22 — so the expected number of
 * whistles across an entire visit was less than one. Verified: zero in
 * fifty-four seconds, with the 620-1300 Hz band never rising above -49.8 dB.
 *
 * A voice that rare is not restrained, it is absent, and "rarer than the
 * banjo" is satisfied at a far higher number than that. The whistle is the
 * only human thing in the mix and it now answers roughly every second or
 * third phrase.
 */
const WHISTLE_CHANCE: Record<MusicState, number> = {
  silence: 0,
  sparse: 0.45,
  journey: 0.6,
  reflective: 0.3,
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
        /* Roughly one note in five is slid into, and never the drone — a
           player bends the tune, not the string keeping time. A whole tone
           twice as often as a semitone, because the wider one is the gesture
           the ear actually recognises. */
        const ornament =
          n.note !== NOTES.D3 && Math.random() < 0.22
            ? Math.random() < 0.66
              ? 0.891
              : 0.944
            : undefined;

        pluck(context, desk.bus.music, {
          frequency: n.note,
          slideFrom: ornament,
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
      /* One phrase of separation, not two. Two meant the whistle could never
         answer the phrase it was actually answering. */
      if (sinceWhistle >= 1 && Math.random() < WHISTLE_CHANCE[state]) {
        sinceWhistle = 0;
        const line = WHISTLES[Math.floor(Math.random() * WHISTLES.length)];
        /* One call for the whole line, not one per note. The phrase is a
           single continuous tone that slides between its pitches, which is
           what a person does and what an oscillator per note cannot. */
        whistle(context, desk.bus.music, {
          notes: line.map((n) => ({
            at: n.at * BEAT,
            note: n.note,
            hold: n.hold,
          })),
          /* A held sine an octave above the banjo carries further than a
             pluck of the same peak, so this reads *above* the instrument at a
             number below its loudest note — which is what a person whistling
             over a banjo actually sounds like. */
          level: 0.34,
          pan: (Math.random() - 0.5) * 0.4,
          when: phraseEnd + 0.3,
        });
      }

      /*
        The guitar's reply, in the gap.

        Placed nearly a beat after the phrase ends so the banjo's last note has
        somewhere to ring, and rolled over two beats so it arrives as an
        instrument being played rather than as a chord being triggered.
      */
      if (Math.random() < GUITAR_CHANCE[state]) {
        const voicing = GUITAR[Math.floor(Math.random() * GUITAR.length)];
        /* The low string sits left of centre, the way a player's hand does. */
        const spread = (Math.random() - 0.5) * 0.3;
        for (let i = 0; i < voicing.length; i += 1) {
          guitar(context, desk.bus.music, {
            frequency: voicing[i],
            /* Nylon rings longer than a banjo head lets it. */
            decay: 2.2 + Math.random() * 0.8,
            /* A soft fingerpick: dark, and quieter as the roll climbs, which
               is what a thumb followed by three fingers actually does. */
            attack: 0.2 + Math.random() * 0.12,
            level: (0.24 - i * 0.025) * (0.9 + Math.random() * 0.2),
            pan: spread + (i - 1.5) * 0.06,
            when: phraseEnd + (0.9 + ROLL[i]) * BEAT + (Math.random() - 0.5) * 0.02,
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
