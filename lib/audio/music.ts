import type { Desk } from "./buses";
import { type Sustained, bow, guitar, harmonica, whistle } from "./instruments";

/**
 * The Frontier motif.
 *
 * Original, and deliberately so. §10 forbids reproducing any existing western
 * soundtrack's melody, harmony or arrangement, and §42 asks instead for
 * something with a stated shape: a sparse plucked lead, a human whistle,
 * 70–100 BPM,
 * open fifths, major/minor ambiguity, and real pauses. What is written below
 * is that brief and nothing else — no transcription, no quotation.
 *
 * The ambiguity is in the note set. D–F–G–A–C is D minor pentatonic, but the
 * drone alternates D and A — a bare fifth with no third in it — so the
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
  /* The drone's two notes, an octave below the guitar's lowest. */
  D2: 73.42,
  A2: 110.0,
  D3: 146.83,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  Bb3: 233.08,
  C4: 261.63,
  /* The flat second, and the only note in this file that is there to be
     uncomfortable. Over a D drone an E-flat is a semitone of grinding, which
     is the standoff cue's whole harmonic argument — see standoffCue. It is a
     mode, not a melody: Phrygian colour, deliberately not the minor
     pentatonic the Frontier cue is built from. */
  Eb4: 311.13,
  D4: 293.66,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  Eb5: 622.25,
  /* The whistle's octave. People whistle high — roughly 700 Hz to 2 kHz — and
     putting it up here is both the truthful range and the reason it can be
     picked out at all: it is the only voice above the guitar's top string. */
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  C6: 1046.5,
  D6: 1174.66,
} as const;

/** 84 BPM. Walking pace, which is the pace of the thing on screen. */
const BEAT = 60 / 84;

/** 66 BPM. Slower than a walk: the pace of standing still and watching. */
const STANDOFF_BEAT = 60 / 66;

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
  Four figures, and the rests inside them are as composed as the notes.

  Each is a pedal on the low string with a tune over it — the thumb keeps a
  pulse while the fingers carry the melody. That shape was written for a banjo
  and transferred to the guitar without a note changing, which is not luck:
  clawhammer and fingerstyle are the same right hand, and the difference
  between the two instruments was never in what was played.

  None of them fills its own length: every phrase ends with at least two beats
  of nothing, which is what stops a loop sounding like a loop.
*/
const FIGURES: Phrase[] = [
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

  §8 asks for the whistle to be much rarer than the guitar, to sit in long gaps
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
const VOICINGS: number[][] = [
  [NOTES.D3, NOTES.A3, NOTES.D4, NOTES.F4],
  [NOTES.G3, NOTES.D4, NOTES.G4, NOTES.C5],
  [NOTES.A3, NOTES.C4, NOTES.G4, NOTES.D5],
];

/** Beats into the roll for each of the four notes. A thumb, then fingers. */
const ROLL = [0, 0.62, 1.24, 1.95];

/**
 * How often a rolled chord answers the figure, per state.
 *
 * It lands in the gap rather than underneath: the figure is the rhythm and the
 * roll is the reply. This mattered more when the two were different
 * instruments and one could bury the other; now that both are the guitar it is
 * simply what a player does — state a line, then let a chord ring under the
 * silence after it.
 */
const ROLL_CHANCE: Record<MusicState, number> = {
  silence: 0,
  sparse: 0.5,
  journey: 0.62,
  reflective: 0.42,
};

/*
  The mouth organ.

  A third voice, and placed in the arrangement rather than added to it. The
  guitar is the rhythm, the whistle is a person a long way off, and this sits
  between them: mid-register, sustained, and close enough to be someone in the
  same camp rather than someone across the valley.

  It plays where the whistle does %s in the gap after a figure %s but never in
  the same gap. Two human voices answering the same phrase is a duet, and the
  point of both of them is that the frontier is mostly empty.

  Lines are short and end on a long note. A harmonica phrase that keeps moving
  sounds like practice; one that arrives somewhere and holds sounds like
  somebody meaning it. `at` is in beats and `hold` in seconds, matching the
  whistle's tables.
*/
const REED: Array<Array<{ at: number; note: number; hold: number; bend?: number }>> = [
  [
    { at: 0, note: NOTES.D4, hold: 1.1, bend: 1 },
    { at: 1.5, note: NOTES.F4, hold: 0.8 },
    { at: 2.4, note: NOTES.G4, hold: 2.1 },
  ],
  [
    { at: 0, note: NOTES.A4, hold: 0.9 },
    { at: 1.1, note: NOTES.G4, hold: 0.7 },
    { at: 1.9, note: NOTES.F4, hold: 0.8, bend: 2 },
    { at: 3, note: NOTES.D4, hold: 2.3 },
  ],
  [
    /* The sigh. Two notes and a bend, and it is the one most often heard. */
    { at: 0, note: NOTES.C4, hold: 1.4 },
    { at: 1.8, note: NOTES.D4, hold: 2.6, bend: 1 },
  ],
];

/** How often the mouth organ answers, per state. */
const REED_CHANCE: Record<MusicState, number> = {
  silence: 0,
  sparse: 0.34,
  journey: 0.4,
  reflective: 0.3,
};

/**
 * How often a phrase is followed by a whistle, per state.
 *
 * These have been raised twice, and the second time was measured rather than
 * argued. §8 asks for the whistle to be much rarer than the lead, and taken
 * literally that produced a voice nobody ever heard: in `sparse` a phrase and
 * its rest run nine to fourteen seconds, the gate below wanted two phrases
 * between whistles, and the chance was 0.22 — so the expected number of
 * whistles across an entire visit was less than one. Verified: zero in
 * fifty-four seconds, with the 620-1300 Hz band never rising above -49.8 dB.
 *
 * A voice that rare is not restrained, it is absent, and "rarer than the
 * lead" is satisfied at a far higher number than that. The whistle is the
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

/* =========================================================================
   THE STANDOFF CUE

   A second piece of music for the same landscape, and an alternative rather
   than a replacement: the two are compared behind a development switch and
   only one ever ships. Everything below is original. The brief names a film
   and then spends a paragraph forbidding it, which is the right instruction
   and an easy one to honour by working from the situation rather than from
   any recording — a wide empty country, and somebody waiting in it.

   WHAT MAKES IT DIFFERENT FROM THE FRONTIER CUE

   The Frontier cue is a player. Its figures are pedal-and-melody, a thumb
   keeping time on the low string while the fingers carry a tune, at a walking
   84, with a mouth organ answering. It sounds like somebody playing a guitar
   in a landscape.

   This one is the landscape. Three notes in twelve beats, no pedal, nothing
   keeping time at all; the low string is struck for its resonance and then
   left. At 66 the gaps run eleven to twenty-four seconds, which is long
   enough that the wind is the main voice for most of the cue and the guitar
   is an interruption of it.

   THE TENSION IS A MODE, NOT A MOTIF

   What makes a held western frame feel loaded is harmonic, and the cheapest
   honest way to get it is the flat second: an E-flat over a D drone, a
   semitone apart, sounded and then left to grind before anything resolves it.
   Phrygian colour. It is a scale degree rather than a tune, it belongs to
   nobody, and it is not the rising-third-and-octave call the brief is
   steering around — there is no such interval anywhere below.

   NO MOUTH ORGAN

   The reed is a third human voice, and this cue wants two people in the
   country at most: one holding a guitar and one somewhere over a ridge. So
   the reed chance is zero here rather than lowered. The instrument still
   exists and the Frontier cue still uses it.
   ========================================================================= */

const STANDOFF_FIGURES: Phrase[] = [
  {
    /* The statement. Three notes across twelve beats, and the third arrives
       long after the ear has stopped expecting one. */
    beats: 12,
    notes: [
      { at: 0, note: NOTES.D3, level: 0.44, pan: -0.12 },
      { at: 3.5, note: NOTES.A3, level: 0.3, pan: 0.08 },
      { at: 7, note: NOTES.D4, level: 0.26, pan: 0 },
    ],
  },
  {
    /* The one with the grind in it. E-flat against the drone's D, held by the
       string's own decay rather than resolved. */
    beats: 12,
    notes: [
      { at: 0, note: NOTES.A3, level: 0.4, pan: -0.1 },
      { at: 2.5, note: NOTES.Eb4, level: 0.29, pan: 0.12 },
      { at: 6, note: NOTES.D4, level: 0.27, pan: 0.02 },
    ],
  },
  {
    /* Two notes, low and close: an open string struck and answered a fourth
       above it, both left to ring into the gap. */
    beats: 10,
    notes: [
      { at: 0, note: NOTES.D3, level: 0.46, pan: -0.15 },
      { at: 4, note: NOTES.F3, level: 0.24, pan: 0.1 },
    ],
  },
  {
    /* One note. The sparest thing in either cue, and the piece is not poorer
       for it — silence is the material here and this phrase is mostly made of
       it. */
    beats: 10,
    notes: [{ at: 0, note: NOTES.A3, level: 0.34, pan: 0 }],
  },
];

/*
  Two notes and a long hold, falling.

  The Frontier whistles are three-note lines that go somewhere. These drop an
  interval and stay there, which is what somebody does when they are not
  performing: a call across distance rather than a tune. The last is a single
  held note, and it is the one most often heard.
*/
const STANDOFF_WHISTLES: Array<Array<{ at: number; note: number; hold: number }>> = [
  [
    { at: 0, note: NOTES.A5, hold: 1.6 },
    { at: 2.6, note: NOTES.D5, hold: 2.8 },
  ],
  [
    { at: 0, note: NOTES.D6, hold: 1.3 },
    { at: 3, note: NOTES.A5, hold: 3 },
  ],
  [{ at: 0, note: NOTES.F5, hold: 2.4 }],
];

/*
  Three notes, not four: fifths and one piece of grit.

  The middle voicing is the tension chord — D and A with the flat second on
  top, which is the same argument the figures make, made once more underneath
  the silence after them.
*/
const STANDOFF_VOICINGS: number[][] = [
  [NOTES.D3, NOTES.A3, NOTES.D4],
  [NOTES.D3, NOTES.A3, NOTES.Eb4],
  [NOTES.G3, NOTES.D4, NOTES.A4],
];

/* Slower than the Frontier roll, and three fingers rather than four. */
const STANDOFF_ROLL = [0, 0.8, 1.7];

/**
 * A cue: one piece of music, described entirely in data.
 *
 * The scheduler below knows how to play a cue and nothing about which one it
 * is playing. That is what makes the comparison honest — both versions go
 * through the same look-ahead, the same humanising jitter and the same bus,
 * so a listener is comparing the music and not two different amounts of
 * engineering.
 */
export interface Cue {
  /** Seconds per beat. */
  beat: number;
  figures: Phrase[];
  whistles: Array<Array<{ at: number; note: number; hold: number }>>;
  voicings: number[][];
  /** Beats into the roll, one per voicing note. */
  roll: number[];
  /** The two notes the bed alternates between, and how loud it sits. */
  drone: { low: number; high: number; level: number; quietLevel: number };
  whistleChance: Record<MusicState, number>;
  rollChance: Record<MusicState, number>;
  reedChance: Record<MusicState, number>;
  tremoloChance: Record<MusicState, number>;
  /** The gap after each phrase, in beats. */
  rest: Record<MusicState, [number, number]>;
  /**
   * The way out.
   *
   * Played once when the visitor leaves for the territory, after which the
   * cue stops rather than fades — a cadence, not a crossfade. The brief asks
   * that nothing loop forever and for a short resolution on entering the
   * frontier; this is both, and it is the only part of either cue allowed to
   * sound finished.
   */
  closing: Phrase;
}

export const frontierCue: Cue = {
  beat: BEAT,
  figures: FIGURES,
  whistles: WHISTLES,
  voicings: VOICINGS,
  roll: ROLL,
  drone: { low: NOTES.D2, high: NOTES.A2, level: 0.15, quietLevel: 0.11 },
  whistleChance: WHISTLE_CHANCE,
  rollChance: ROLL_CHANCE,
  reedChance: REED_CHANCE,
  /* The Frontier cue has no tremolo: its right hand is already busy. */
  tremoloChance: { silence: 0, sparse: 0, journey: 0, reflective: 0 },
  rest: REST,
  closing: {
    beats: 6,
    notes: [
      { at: 0, note: NOTES.D3, level: 0.4, pan: -0.1 },
      { at: 1, note: NOTES.A3, level: 0.3, pan: 0.06 },
      { at: 2, note: NOTES.D4, level: 0.26, pan: 0 },
    ],
  },
};

export const standoffCue: Cue = {
  beat: STANDOFF_BEAT,
  figures: STANDOFF_FIGURES,
  whistles: STANDOFF_WHISTLES,
  voicings: STANDOFF_VOICINGS,
  roll: STANDOFF_ROLL,
  /* Quieter than the Frontier bed by a third. The wind is the floor of this
     cue, and a drone at 0.15 was competing with it for the same job. */
  drone: { low: NOTES.D2, high: NOTES.A2, level: 0.1, quietLevel: 0.075 },
  /* Rarer than the Frontier cue on every count. A voice that arrives in one
     gap out of three is a person; one that arrives in two is an accompanist. */
  whistleChance: { silence: 0, sparse: 0.34, journey: 0.44, reflective: 0.24 },
  rollChance: { silence: 0, sparse: 0.34, journey: 0.4, reflective: 0.3 },
  reedChance: { silence: 0, sparse: 0, journey: 0, reflective: 0 },
  tremoloChance: { silence: 0, sparse: 0.18, journey: 0.24, reflective: 0.12 },
  /* At 66 BPM these are gaps of eleven to twenty-four seconds. Long enough to
     look like a mistake on paper and correct in the room: the landscape is the
     subject and the guitar is what happens to it occasionally. */
  rest: { silence: [0, 0], sparse: [12, 22], journey: [7, 13], reflective: [16, 26] },
  closing: {
    beats: 6,
    notes: [
      { at: 0, note: NOTES.Bb3, level: 0.36, pan: -0.08 },
      { at: 1.6, note: NOTES.A3, level: 0.32, pan: 0.05 },
      { at: 3.2, note: NOTES.D3, level: 0.42, pan: -0.12 },
    ],
  },
};

/** The two cues, by name. The comparison switch reads this and nothing else. */
export const CUES = { frontier: frontierCue, standoff: standoffCue } as const;

export type CueName = keyof typeof CUES;

export interface Conductor {
  setState(next: MusicState): void;
  /**
   * Play the closing figure and stop.
   *
   * Not a state, which is why it is a method: a state is somewhere the music
   * can sit, and this is a thing it does once on the way out. After the
   * cadence the cue is silent and stays silent until somebody sets a state
   * again.
   */
  resolve(): void;
  /** Swap the piece being played. Development only — see AudioLab. */
  setCue(next: Cue): void;
  stop(): void;
}

/**
 * Starts the music and returns the handle that steers it.
 *
 * The scheduler wakes four times a second and fills a two-second window with
 * anything due. That is the standard Web Audio pattern and it exists because
 * the alternative — a timer per note — drifts audibly within a few bars.
 */
export function conduct(
  desk: Desk,
  initial: MusicState = "silence",
  initialCue: Cue = frontierCue,
): Conductor {
  const { context } = desk;
  let state: MusicState = initial;
  let cue = initialCue;
  /* Where the next phrase begins, in context time. */
  let cursor = context.currentTime + 0.4;
  /* Phrases since the last whistle, so it cannot arrive twice in a row. */
  let sinceWhistle = 0;
  let index = Math.floor(Math.random() * cue.figures.length);
  /* Set while the closing figure is ringing, so the scheduler does not lay a
     new phrase over a cadence that is meant to be the last thing heard. */
  let resolving = false;

  /*
    The drone runs on its own clock.

    It has nothing to do with the phrase cursor and must not: the guitar rests
    for up to sixteen beats at a time, and a bed that stopped during the rests
    would be a bed nobody could hear the point of. So it is scheduled by the
    same look-ahead, overlapping itself, and the guitar plays over whatever it
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
    if (state === "silence" || resolving) {
      /* Keep the cursors with the clock, so leaving silence does not dump a
         backlog of phrases into the present all at once. */
      cursor = Math.max(cursor, context.currentTime + 0.4);
      droneCursor = Math.max(droneCursor, context.currentTime + 0.4);
      return;
    }

    /* The bed, first, so the guitar has something to land on. */
    while (droneCursor < context.currentTime + LOOKAHEAD) {
      const length = 15 + Math.random() * 6;
      /* D and A alternating: the bare fifth is in the drone itself, which is
         where the mode's ambiguity comes from. */
      droneRoot = (droneRoot + 1) % 2;
      drones.push(
        bow(context, desk.bus.music, {
          frequency: droneRoot === 0 ? cue.drone.low : cue.drone.high,
          duration: length,
          level: state === "reflective" ? cue.drone.quietLevel : cue.drone.level,
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
      let next = Math.floor(Math.random() * cue.figures.length);
      if (next === index) next = (next + 1) % cue.figures.length;
      index = next;
      const phrase = cue.figures[index];

      /* Reflective leans on the sparest phrase; journey avoids it. The sparest
         is last in both cues by convention, which is worth stating because it
         is the one piece of shared knowledge between a cue and the scheduler
         that is not in the type. */
      const chosen =
        state === "reflective" && Math.random() < 0.5
          ? cue.figures[cue.figures.length - 1]
          : phrase;

      for (const n of chosen.notes) {
        /* Roughly one note in four is slid into, and never the pedal — a
           player bends the tune, not the string keeping time. A whole tone
           twice as often as a semitone, because the wider one is the gesture
           the ear actually recognises.

           Raised from one in five with the move to guitar. On a banjo the
           slide was an ornament; on a guitar it is most of the accent. */
        const ornament =
          n.note !== NOTES.D3 && Math.random() < 0.26
            ? Math.random() < 0.66
              ? 0.891
              : 0.944
            : undefined;

        guitar(context, desk.bus.music, {
          frequency: n.note,
          slideFrom: ornament,
          /* Gut rings longer than a banjo head ever let it: 1.6 s was a note
             being stopped, not a note ending. */
          decay: 2.1 + Math.random() * 0.7,
          /* A hand is never even. This is the difference between a player and
             a sequencer, and it is worth more than any amount of reverb.

             Softer than the banjo's pick, too — `attack` sets brightness as
             well as force, and a nylon string struck as hard as a banjo is a
             nylon string being mistaken for one. */
          attack: n.level * (0.55 + Math.random() * 0.3),
          level: n.level * (0.9 + Math.random() * 0.2),
          pan: n.pan,
          when: cursor + n.at * cue.beat + (Math.random() - 0.5) * 0.018,
        });
      }

      const phraseEnd = cursor + chosen.beats * cue.beat;

      /* The whistle answers the guitar rather than sitting on top of it: it
         enters after the phrase, in the gap. */
      sinceWhistle += 1;
      let answered = false;
      /* One phrase of separation, not two. Two meant the whistle could never
         answer the phrase it was actually answering. */
      if (sinceWhistle >= 1 && Math.random() < cue.whistleChance[state]) {
        sinceWhistle = 0;
        answered = true;
        const line = cue.whistles[Math.floor(Math.random() * cue.whistles.length)];
        /* One call for the whole line, not one per note. The phrase is a
           single continuous tone that slides between its pitches, which is
           what a person does and what an oscillator per note cannot. */
        whistle(context, desk.bus.music, {
          notes: line.map((n) => ({
            at: n.at * cue.beat,
            note: n.note,
            hold: n.hold,
          })),
          /* A held sine an octave above the guitar carries further than a
             pluck of the same peak, so this reads *above* the instrument at a
             number below its loudest note — which is what a person whistling
             over a guitar actually sounds like. */
          level: 0.34,
          pan: (Math.random() - 0.5) * 0.4,
          when: phraseEnd + 0.3,
        });
      }

      /*
        The mouth organ, in the gaps the whistle did not take.

        Guarded rather than rolled independently: both are people, and two of
        them answering the same figure turns an empty country into a band.
      */
      if (!answered && Math.random() < cue.reedChance[state]) {
        const line = REED[Math.floor(Math.random() * REED.length)];
        harmonica(context, desk.bus.music, {
          notes: line.map((n) => ({
            at: n.at * cue.beat,
            note: n.note,
            hold: n.hold,
            bend: n.bend,
          })),
          /* Under the whistle, over the guitar's quieter notes. A reed
             sustains, and a sustained tone at the whistle's level would sit
             on top of everything for four beats at a time. */
          level: 0.24,
          pan: (Math.random() - 0.5) * 0.5,
          when: phraseEnd + 0.45,
        });
      }

      /*
        The guitar's reply, in the gap.

        Placed nearly a beat after the phrase ends so its last note has
        somewhere to ring, and rolled over two beats so it arrives as an
        instrument being played rather than as a chord being triggered.
      */
      if (Math.random() < cue.rollChance[state]) {
        const voicing = cue.voicings[Math.floor(Math.random() * cue.voicings.length)];
        /* The low string sits left of centre, the way a player's hand does. */
        const spread = (Math.random() - 0.5) * 0.3;
        for (let i = 0; i < voicing.length; i += 1) {
          guitar(context, desk.bus.music, {
            frequency: voicing[i],
            /* Left to ring: this is the chord under the silence. */
            decay: 2.2 + Math.random() * 0.8,
            /* A soft fingerpick: dark, and quieter as the roll climbs, which
               is what a thumb followed by three fingers actually does. */
            attack: 0.2 + Math.random() * 0.12,
            level: (0.24 - i * 0.025) * (0.9 + Math.random() * 0.2),
            pan: spread + (i - 1.5) * 0.06,
            when: phraseEnd + (0.9 + cue.roll[i]) * cue.beat + (Math.random() - 0.5) * 0.02,
          });
        }
      }

      /*
        Tremolo: one note struck repeatedly, thinning out.

        Written here rather than as an instrument because that is what it is —
        a right hand doing the same thing several times quickly, not a new
        sound. Eleven strikes over about three quarters of a second, each
        softer and fractionally later than even, so it reads as a hand tiring
        rather than a delay line.

        The standoff cue is the only one that uses it. It is the one gesture in
        the palette that sustains, and a piece with this much silence in it
        needs somewhere to hold a note without adding an instrument to do it.
      */
      if (Math.random() < cue.tremoloChance[state]) {
        const top = chosen.notes[chosen.notes.length - 1];
        const STRIKES = 11;
        for (let i = 0; i < STRIKES; i += 1) {
          const fade = 1 - i / STRIKES;
          guitar(context, desk.bus.music, {
            frequency: top.note,
            decay: 0.9 + Math.random() * 0.4,
            attack: 0.16 * fade + 0.04,
            level: top.level * 0.42 * fade,
            pan: top.pan + (Math.random() - 0.5) * 0.06,
            when:
              phraseEnd + 0.5 + i * 0.068 + (Math.random() - 0.5) * 0.012,
          });
        }
      }

      const [restMin, restMax] = cue.rest[state];
      cursor = phraseEnd + (restMin + Math.random() * (restMax - restMin)) * cue.beat;
    }
  };

  schedule();
  const timer = window.setInterval(schedule, 250);

  return {
    setState(next) {
      if (next === state) return;
      state = next;
      /* A state change cancels a cadence in progress: the visitor went
         somewhere else, and the way out of the landing is no longer the last
         thing the music has to say. */
      resolving = false;
      /* §21: the landing's music has to be gone before the visitor settles
         anywhere else. A drone holds for twenty seconds, so silence has to
         actually take it away rather than just stop scheduling more. */
      if (next === "silence") hushDrones();
    },
    resolve() {
      if (state === "silence" || resolving) return;
      resolving = true;
      const at = context.currentTime + 0.12;
      for (const n of cue.closing.notes) {
        guitar(context, desk.bus.music, {
          frequency: n.note,
          /* Longer than any phrase note. The last thing heard should still be
             ringing when the next place arrives. */
          decay: 3.4 + Math.random() * 0.6,
          attack: n.level * 0.6,
          level: n.level,
          pan: n.pan,
          when: at + n.at * cue.beat,
        });
      }
      /* The bed goes with it, over the length of the figure, so the cadence
         lands on air rather than on a drone that outlives it. */
      hushDrones(cue.closing.beats * cue.beat);
      state = "silence";
    },

    setCue(next) {
      if (next === cue) return;
      cue = next;
      index = 0;
      /* The old cue's bed is in the old cue's tuning. Let it go rather than
         crossfade two pieces of music into each other. */
      hushDrones(1.2);
      cursor = Math.max(cursor, context.currentTime + 0.4);
      droneCursor = Math.max(droneCursor, context.currentTime + 0.4);
    },

    stop() {
      window.clearInterval(timer);
      state = "silence";
      resolving = false;
      hushDrones(0.9);
    },
  };
}
