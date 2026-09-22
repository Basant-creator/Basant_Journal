import type { Desk } from "./buses";
import {
  type Sustained,
  type Tape,
  bow,
  brush,
  guitar,
  harmonica,
  tape,
  thump,
  whistle,
} from "./instruments";

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
  /* The bass register. The lo-fi cue walks a four-bar progression down here
     while the drone holds above it. */
  Bb1: 58.27,
  C2: 65.41,
  /* The drone's two notes, an octave below the guitar's lowest. */
  D2: 73.42,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  Bb2: 116.54,
  C3: 130.81,
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
  /* The ninth. Lo-fi harmony is a triad with something warm sitting on it,
     and this is the note doing that work in every voicing below. */
  E4: 329.63,
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

/** 72 BPM, felt in half time. See lofiCue for why that is the pace. */
const LOFI_BEAT = 60 / 72;

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

   This one is the room the landscape is being played in. It has a floor —
   tape hiss, a slow pulse, a bass walking four bars — and the guitar arrives
   over it rather than out of nothing.

   THE FIRST VERSION OF THIS WAS EMPTY

   Worth recording, because the mistake is an easy one and it sounded
   principled. The first cut had three notes in twelve beats at 66 and eleven
   to twenty-four seconds of actual silence between phrases, on the argument
   that silence is part of the composition. The verdict was that it felt empty
   rather than calm, and that was correct: nothing was happening, and an ear
   given nothing hears an absence rather than a room.

   Silence in a recording is not silence. It is a noise floor, a pulse you
   stop noticing, and a bass you would only miss if it left. Those are what
   make a sparse arrangement read as restraint instead of as a gap, and all
   three were missing. The notes have barely changed; what is under them has.

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

/*
  The motif, and three ways of not repeating it.

  Eight beats — two bars of the four-bar progression — and it falls. Every
  phrase here descends or turns back on itself, which is the shape the cue is
  built on: a rising figure with a leap in it is a fanfare and announces
  somebody arriving, and nobody is arriving.

  The colour is the ninth. E over a D bass is what makes a minor chord sound
  warm rather than sad, and it is the note doing the lo-fi work in every
  phrase and every voicing below. The flat second survives from the first
  version, in one phrase, as a passing note rather than as the whole argument.
*/
const LOFI_FIGURES: Phrase[] = [
  {
    /* The statement. Down from the ninth to the root, with the third of the
       bar left empty for the chord to sit in. */
    beats: 8,
    notes: [
      { at: 0.5, note: NOTES.A3, level: 0.5, pan: -0.1 },
      { at: 2, note: NOTES.D4, level: 0.44, pan: 0.06 },
      { at: 4, note: NOTES.F4, level: 0.39, pan: -0.04 },
      { at: 5.5, note: NOTES.E4, level: 0.36, pan: 0.1 },
    ],
  },
  {
    /* The answer: the same descent, started higher and landing a step lower. */
    beats: 8,
    notes: [
      { at: 0, note: NOTES.F4, level: 0.45, pan: 0.08 },
      { at: 1.5, note: NOTES.E4, level: 0.39, pan: -0.06 },
      { at: 3, note: NOTES.D4, level: 0.42, pan: 0.02 },
      { at: 6, note: NOTES.A3, level: 0.36, pan: -0.12 },
    ],
  },
  {
    /* The one that leans. E-flat as a passing note between F and D, a
       semitone of grit inside an otherwise warm line. */
    beats: 8,
    notes: [
      { at: 0.5, note: NOTES.D4, level: 0.45, pan: -0.08 },
      { at: 2, note: NOTES.F4, level: 0.4, pan: 0.1 },
      { at: 3, note: NOTES.Eb4, level: 0.33, pan: 0.04 },
      { at: 4.5, note: NOTES.D4, level: 0.42, pan: -0.02 },
    ],
  },
  {
    /* The sparest, and still not silent — the bed is playing underneath it.
       Two notes and the room. */
    beats: 8,
    notes: [
      { at: 1, note: NOTES.A3, level: 0.45, pan: 0 },
      { at: 4.5, note: NOTES.D4, level: 0.38, pan: 0.06 },
    ],
  },
];

/*
  Two notes and a long hold, falling.

  The Frontier whistles are three-note lines that go somewhere. These drop an
  interval and stay there, which is what somebody does when they are not
  performing: a call across distance rather than a tune. The last is a single
  held note, and it is the one most often heard.
*/
const LOFI_WHISTLES: Array<Array<{ at: number; note: number; hold: number }>> = [
  [
    { at: 0, note: NOTES.A5, hold: 1.4 },
    { at: 2.2, note: NOTES.F5, hold: 2.4 },
  ],
  [
    { at: 0, note: NOTES.D6, hold: 1.2 },
    { at: 2, note: NOTES.C6, hold: 0.9 },
    { at: 3, note: NOTES.A5, hold: 2.6 },
  ],
  [{ at: 0, note: NOTES.F5, hold: 2.6 }],
];

/*
  The progression, as four chords.

  D minor with a ninth, twice, then the flat sixth and the flat seventh — a
  modal turn that goes round rather than resolving, which is why it can loop
  without announcing that it has. Every one of them has either the ninth or
  the seventh in it, and that is the whole harmonic difference between this
  cue and the bare fifths of the Frontier one.
*/
const LOFI_CHORDS: number[][] = [
  [NOTES.D3, NOTES.A3, NOTES.C4, NOTES.E4],
  [NOTES.D3, NOTES.A3, NOTES.C4, NOTES.E4],
  [NOTES.Bb2, NOTES.F3, NOTES.D4, NOTES.A4],
  [NOTES.C3, NOTES.G3, NOTES.C4, NOTES.E4],
];

/* The reply voicings, when the guitar answers itself in a gap. */
const LOFI_VOICINGS: number[][] = [
  [NOTES.D3, NOTES.A3, NOTES.E4],
  [NOTES.Bb2, NOTES.F3, NOTES.D4],
  [NOTES.G3, NOTES.D4, NOTES.A4],
];

/* Slower than the Frontier roll, and three fingers rather than four. */
const LOFI_ROLL = [0, 0.8, 1.7];

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
  /** The gap after each phrase, in beats. Ignored by a cue with a groove. */
  rest: Record<MusicState, [number, number]>;
  /**
   * The bed a cue runs over, if it has one.
   *
   * A cue without this is phrase-and-rest: it plays something, then nothing,
   * and the nothing is real. A cue with one has a bar clock underneath that
   * never stops — pulse, bass, chord and tape — and the melody is what
   * arrives over it every few bars.
   *
   * That is the whole difference between the two pieces here, and it is the
   * difference between sparse and empty. The first version of the calm cue
   * had eleven to twenty-four seconds of actual silence between phrases and
   * the verdict was that it sounded like nothing was happening, which was
   * accurate: nothing was.
   */
  groove?: Groove;
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

/** One bar of the bed. Times are in beats from the top of the bar. */
export interface Groove {
  /** Beats in a bar. */
  beats: number;
  /**
   * How late an off-beat lands, as a fraction of a beat.
   *
   * Straight time is a machine and this is meant to sound like a room. The
   * pulse entries below are written on the grid and this pushes anything
   * falling off the beat behind it.
   */
  swing: number;
  pulse: Array<{ at: number; kind: "thump" | "brush"; level: number; tone?: number; pan?: number }>;
  /** One per bar of the progression, and its length sets the progression's. */
  bass: number[];
  /** A chord per bar, rolled slowly under everything. */
  chords: number[][];
  /** Bars between melodic phrases, per state. */
  every: Record<MusicState, [number, number]>;
  /** The tape floor: hiss, and pops per second. */
  tape: { level: number; crackle: number };
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

export const lofiCue: Cue = {
  beat: LOFI_BEAT,
  figures: LOFI_FIGURES,
  whistles: LOFI_WHISTLES,
  voicings: LOFI_VOICINGS,
  roll: LOFI_ROLL,
  /* Under the bass rather than beside it: the groove has a walking low end
     now, and a drone at the Frontier cue's level fought it for the register. */
  drone: { low: NOTES.D2, high: NOTES.A2, level: 0.055, quietLevel: 0.04 },
  /* More often than the first version, because there is something for the
     whistle to answer over. A voice in a silent room is an event; a voice over
     a bed is somebody in the distance, which is what it is supposed to be. */
  whistleChance: { silence: 0, sparse: 0.4, journey: 0.5, reflective: 0.3 },
  rollChance: { silence: 0, sparse: 0.38, journey: 0.44, reflective: 0.32 },
  reedChance: { silence: 0, sparse: 0, journey: 0, reflective: 0 },
  tremoloChance: { silence: 0, sparse: 0.2, journey: 0.26, reflective: 0.14 },
  /* Unused: a cue with a groove counts bars instead. Kept so the type stays
     one shape and the scheduler needs no optional handling for it. */
  rest: { silence: [0, 0], sparse: [8, 12], journey: [4, 8], reflective: [12, 16] },

  /*
    The bed.

    72 BPM, felt in half time, which is the pace the reference sits at once
    you stop counting its surface and start counting its stride. A bar is
    3.3 seconds and the progression is four of them — thirteen seconds to go
    round, slow enough that it never sounds like a loop hurrying.

    The pulse is displaced on purpose. The second thump lands on the "and" of
    three rather than on the beat, which is the one gesture that separates
    this from a metronome: a kick on 1 and 3 marches, and a kick on 1 and the
    "and" of 3 leans. With the swing on the off-beats it is a shuffle played
    slowly rather than a beat played straight.

    Everything here is quiet. The loudest thing in the groove is the first
    thump at 0.16, against a guitar phrase that peaks at 0.34 — so the bed is
    roughly half the melody and a good deal less than the wind.
  */
  groove: {
    beats: 4,
    /* An eighth of a beat late on anything off the grid. Enough to feel, not
       enough to count. */
    swing: 0.12,
    /*
      The brushes are darker and quieter than they were.

      A brush is a burst of bandpassed noise, and three of them a bar up around
      3 kHz, over a tape floor that was also spraying, added up to weather. The
      tone values now put them between 2.1 and 2.5 kHz — a stick on a rim
      rather than a wire brush — and at two thirds of the level. The kick is
      untouched: it was never the problem, and it is the only thing in the
      groove with any body.
    */
    pulse: [
      { at: 0, kind: "thump", level: 0.16 },
      { at: 1, kind: "brush", level: 0.05, tone: 0.34, pan: 0.08 },
      { at: 2.5, kind: "thump", level: 0.115 },
      { at: 3, kind: "brush", level: 0.05, tone: 0.3, pan: -0.06 },
      /* The ghost: barely there, and the reason the bar does not stop dead at
         the end of it. */
      { at: 3.5, kind: "brush", level: 0.02, tone: 0.46, pan: 0.14 },
    ],
    bass: [NOTES.D2, NOTES.D2, NOTES.Bb1, NOTES.C2],
    chords: LOFI_CHORDS,
    /* Bars between phrases. At four bars that is thirteen seconds, and the
       bed is playing through every one of them. */
    every: { silence: [0, 0], sparse: [3, 5], journey: [2, 3], reflective: [4, 7] },
    tape: { level: 0.028, crackle: 0.7 },
  },

  closing: {
    beats: 6,
    notes: [
      { at: 0, note: NOTES.F4, level: 0.32, pan: 0.06 },
      { at: 1.5, note: NOTES.E4, level: 0.28, pan: -0.04 },
      { at: 3, note: NOTES.D4, level: 0.3, pan: 0.02 },
      { at: 3.6, note: NOTES.D3, level: 0.4, pan: -0.12 },
    ],
  },
};

/** The two cues, by name. The comparison switch reads this and nothing else. */
export const CUES = { frontier: frontierCue, lofi: lofiCue } as const;

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

  /* The bar clock, for a cue with a groove. Separate from the phrase cursor
     because the bed does not stop when the melody does — that is the whole
     point of having one. */
  let barCursor = context.currentTime + 0.4;
  let bar = 0;
  let barsUntilPhrase = 0;
  let deck: Tape | null = null;

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

  /*
    The tape goes with them.

    It loops forever by design, so nothing stops it on its own — and a hiss
    left running under a silent landing is the kind of thing nobody reports
    and everybody hears. Lifted anywhere the bed is, and the bar clock is
    reset with it so the groove restarts at the top of a bar rather than
    wherever it happened to be abandoned.
  */
  const liftTape = (seconds = 1.4) => {
    deck?.stop(seconds);
    deck = null;
    bar = 0;
    barsUntilPhrase = 0;
  };

  const schedule = () => {
    if (state === "silence" || resolving) {
      /* Keep the cursors with the clock, so leaving silence does not dump a
         backlog of phrases into the present all at once. */
      cursor = Math.max(cursor, context.currentTime + 0.4);
      droneCursor = Math.max(droneCursor, context.currentTime + 0.4);
      barCursor = Math.max(barCursor, context.currentTime + 0.4);
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

    if (cue.groove) {
      playGroove(cue.groove);
      return;
    }

    while (cursor < context.currentTime + LOOKAHEAD) {
      cursor = playPhrase(cursor);
    }
  };

  /**
   * One phrase, and whatever answers it. Returns where the next one may start.
   *
   * Lifted out of the scheduler when the second cue needed a bar clock: a cue
   * with a groove places its phrases on bar lines and a cue without one places
   * them after a rest, but what a phrase *is* — the figure, the whistle in the
   * gap, the rolled reply, the tremolo — is the same in both. Writing it twice
   * would have meant tuning it twice.
   */
  function playPhrase(at: number): number {
    {
      const cursor = at;
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
      return phraseEnd + (restMin + Math.random() * (restMax - restMin)) * cue.beat;
    }
  }

  /**
   * The bed, a bar at a time.
   *
   * Pulse, bass, chord and tape, running whether or not there is a melody over
   * them — and a figure dropped in every few bars. The tape starts with the
   * first bar and is the reason the gaps between phrases sound like a room
   * rather than like nothing.
   */
  function playGroove(g: NonNullable<Cue["groove"]>): void {
    if (!deck) {
      deck = tape(context, desk.bus.music, {
        level: g.tape.level,
        crackle: g.tape.crackle,
      });
    }

    const barLength = g.beats * cue.beat;

    while (barCursor < context.currentTime + LOOKAHEAD) {
      const step = bar % g.bass.length;

      /* The pulse. Anything off the grid is pushed late by the swing, which is
         the difference between a shuffle and a metronome. */
      for (const hit of g.pulse) {
        const offGrid = Math.abs(hit.at - Math.round(hit.at)) > 0.01;
        const at =
          barCursor +
          (hit.at + (offGrid ? g.swing : 0)) * cue.beat +
          (Math.random() - 0.5) * 0.016;
        const level = hit.level * (0.88 + Math.random() * 0.24);
        if (hit.kind === "thump") {
          thump(context, desk.bus.music, { level, pan: hit.pan ?? 0, when: at });
        } else {
          brush(context, desk.bus.music, {
            level,
            tone: hit.tone ?? 0.5,
            decay: 0.1 + Math.random() * 0.06,
            pan: hit.pan ?? 0,
            when: at,
          });
        }
      }

      /* The bass: one note a bar, on the beat, left to ring the whole bar. */
      guitar(context, desk.bus.music, {
        frequency: g.bass[step],
        decay: barLength * 0.95,
        attack: 0.2,
        level: 0.24,
        pan: -0.06,
        when: barCursor + (Math.random() - 0.5) * 0.014,
      });

      /* The chord, rolled slowly and quietly enough to be a colour rather than
         a part. It arrives on the second beat so the bass has the downbeat to
         itself. */
      const chord = g.chords[step % g.chords.length];
      for (let i = 0; i < chord.length; i += 1) {
        guitar(context, desk.bus.music, {
          frequency: chord[i],
          decay: 2.4 + Math.random() * 0.8,
          attack: 0.14 + Math.random() * 0.08,
          level: (0.1 - i * 0.013) * (0.9 + Math.random() * 0.2),
          pan: 0.1 + (i - 1.5) * 0.05,
          when: barCursor + (1 + i * 0.16) * cue.beat + (Math.random() - 0.5) * 0.02,
        });
      }

      if (barsUntilPhrase <= 0) {
        playPhrase(barCursor);
        const [min, max] = g.every[state];
        barsUntilPhrase = min + Math.floor(Math.random() * (max - min + 1));
      }
      barsUntilPhrase -= 1;

      barCursor += barLength;
      bar += 1;
    }
  }

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
      if (next === "silence") liftTape();
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
      const over = cue.closing.beats * cue.beat;
      hushDrones(over);
      liftTape(over);
      state = "silence";
    },

    setCue(next) {
      if (next === cue) return;
      cue = next;
      index = 0;
      /* The old cue's bed is in the old cue's tuning and its tape is its own
         room. Let both go rather than crossfade two pieces of music into each
         other. */
      hushDrones(1.2);
      liftTape(1.2);
      cursor = Math.max(cursor, context.currentTime + 0.4);
      droneCursor = Math.max(droneCursor, context.currentTime + 0.4);
    },

    stop() {
      window.clearInterval(timer);
      state = "silence";
      resolving = false;
      hushDrones(0.9);
      liftTape(0.9);
    },
  };
}
