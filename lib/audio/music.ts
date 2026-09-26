import type { Desk } from "./buses";
import {
  type Sustained,
  bow,
  guitar,
  harmonica,
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

/**
 * Hz. D minor pentatonic across two octaves, plus the drone's fifth.
 *
 * The Frontier cue's table, and only its. The standoff cue is written in
 * note names and converted by `hz()` below, so nothing it plays is here.
 */
const NOTES = {
  /* The drone's two notes, an octave below the guitar's lowest. */
  D2: 73.42,
  A2: 110.0,
  D3: 146.83,
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
     picked out at all: it is the only voice above the guitar's top string. */
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
   THE STANDOFF CUE — composed, not rolled

   The second piece for the landing, and the second attempt at one. The first
   was a lo-fi bed — pulse, hat, chop, walking bass, tape — with a melody
   dropped over it every few bars, and the verdict on it was fair: a couple of
   instruments making noise. That was not a mixing problem, and it is worth
   being exact about why, because the Frontier cue above is built the same way
   and only gets away with it by being sparse.

   Every voice rolled its own dice. The figure was picked at random, the
   whistle answered on a coin toss, the reply chord and the tremolo each on
   another, and none of those decisions knew what the others had chosen — or
   which chord the bed was on. A whistle line written against nothing in
   particular landed over whatever happened to be there.

   And it landed 0.3 s after the phrase ended: an offset in seconds, not a
   place in the bar. At 80 BPM that is four tenths of a beat, so the whistle
   arrived off the grid every single time. That was the "not in sync". Nothing
   in the scheduler was late; the whistle had simply never been told where the
   beat was.

   The register complaint is the same fault from another side. A guitar that
   chooses between four figures in one octave stays in that octave forever,
   because nothing is deciding it should go anywhere else. Contour is a
   decision about the whole piece, and a scheduler that only ever looks one
   phrase ahead cannot make one.

   So this cue is a score. Forty bars are written out, one harmony a bar, and
   every voice is placed in beats against a single bar clock. The lead climbs
   from A3 to F5 across the piece and falls back to D3. The low line moves
   against it, the whistle answers in the gaps the guitar leaves, on the grid,
   and the strings follow every chord. What randomness is left is on the
   surface only: a few milliseconds of timing, a tenth of velocity, the last
   beat of a phrase stretched a little. That is what a player adds to a
   written part, and none of it is a decision.

   THE PIECE — "The Surveyor's Last Light"

   70 BPM, 4/4, D minor, 40 bars, about 137 seconds. One man and one distant
   voice across a very wide valley. The dry guitar is the man: he speaks in
   short phrases and then stops, and the silence after each is part of it. The
   whistle is the only other person out there, and it never talks over him. It
   answers in the gap he leaves, usually half a beat late, like sound arriving
   from far off. As the piece tightens the exchanges shorten — two bars each
   way in the statement, one in the build, half-bars in the peak — and near
   the end the two swap roles: the whistle sings the guitar's motif and the
   guitar answers it, low and quiet.

   The arc, bars 0-indexed: wind alone (0), strings (1), a lone low pluck (2),
   the dominant (3). The statement (4-7) is the motif, answered by the
   whistle. Two bars of silence (8-9). The answer (10-15) climbs to C5 and
   falls back to A3, ending on a held breath of strings and one heartbeat. The
   build (16-24) restarts at A3 and climbs to a long tremolo D5, a 4-3
   suspension over A resolving to C#5, then a second held breath. The peak
   (25-30) restates the motif an octave up and climaxes on F5 in bar 29. Bar
   31 is the standoff: the strings fade out of the peak and then nothing at
   all, a bar of wind. The release (32-37) runs over a chromatic lament bass,
   D-C#-C-Bb-A into D, and its strings fade out under the last phrase. Bars
   38-39 are identical to 8-9 — two bars of wind — and the loop re-enters at
   bar 10, so the join is one already heard and every return starts
   mid-story.

   The motif (bars 4-5): a plucked A3, a leap up a minor sixth to F4 in
   tremolo — slid in from E-flat, a Phrygian bruise — a fall by step E4-D4,
   and a drop to Bb3, held. One sudden reach and a long, resigned fall that
   ends lower than it started. The whistle's own figure is a falling semitone
   sigh, Bb5 to A5, heard from far away.

   ORIGINALITY

   The brief is a genre, not a recording, and the score is held to what it
   rules out: no saloon, no upbeat cowboy, no heroic theme, no harmonica, no
   busy percussion — the only percussion is a soft heartbeat in eight bars of
   forty — and no recognisable melody. There is no rising fourth or fifth
   answered by an octave, no arpeggio run, and no quoted phrase. The pitch set
   is D natural minor plus C# on the A chords and one bar of E-flat.

   The score is stored below as it was written, with `tremolo` and `slide`
   left out where they were false, and with one pass for silence after it. The
   brief asks for huge pauses, and as written only 7 of the loop's 30 bars
   had neither guitar nor whistle, and every bar but 0, 9 and 39 had strings:
   something plucked or whistled was ringing 85% of the time. So the strings
   in bars 8, 31 and 38 were taken out (bars 7, 30 and 37 now fade them), and
   the whistle's lone held Bb4 in bar 35 was dropped, leaving 8 of 30 loop
   bars to the strings or the wind and three of them to the wind alone.
   ========================================================================= */

/** Where a bar sits in the arc. */
type Section =
  | "silence"
  | "intro"
  | "statement"
  | "answer"
  | "build"
  | "peak"
  | "release";

/** One written note. `beat` and `dur` are in beats from the top of the bar. */
export interface ScoreNote {
  beat: number;
  /** Scientific pitch — "D2", "C#4", "Bb5" — converted by `hz`. */
  note: string;
  dur: number;
  /** 0..1, relative within its own voice. */
  vel: number;
  /** Lead only: the same string struck about 13 times a second throughout. */
  tremolo?: boolean;
  /** Lead only: slid up a whole tone into the note. */
  slide?: boolean;
}

export interface ScoreBar {
  section: Section;
  /** The harmony as written. For a reader: nothing plays these directly. */
  chord: string;
  chord_tones: string[];
  lead: ScoreNote[];
  low: ScoreNote[];
  whistle: ScoreNote[];
  /** The pad: its pitches, a level, and the bar's shape. */
  strings: {
    notes: string[];
    vel: number;
    swell: "in" | "out" | "hold" | "none";
  };
  /** Beats with a heartbeat on them. */
  pulse: number[];
}

export interface Score {
  title: string;
  bpm: number;
  /** Where the piece re-enters after its last bar. */
  loop_from_bar: number;
  bars: ScoreBar[];
  /** The way out, played once by `resolve()`. */
  closing: ScoreNote[];
}

const PITCH_CLASS: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const FREQUENCIES = new Map<string, number>();

/**
 * A note name to Hz: equal temperament, A4 = 440.
 *
 * The score is written in names, the way it was composed, and converted here
 * rather than as a hand-typed table. A table is forty-odd numbers to get
 * wrong, and every one of them looks right.
 */
function hz(name: string): number {
  const known = FREQUENCIES.get(name);
  if (known !== undefined) return known;
  const match = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!match) throw new Error(`Not a note name: ${name}`);
  const [, letter, accidental, octave] = match;
  const semitone =
    PITCH_CLASS[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
  const midi = (Number(octave) + 1) * 12 + semitone;
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  FREQUENCIES.set(name, frequency);
  return frequency;
}

const STANDOFF_SCORE: Score = {
  title: "The Surveyor's Last Light",
  bpm: 70,
  loop_from_bar: 10,
  bars: [
    /* 0 · silence · Dm */
    {
      section: "silence",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: [], vel: 0, swell: "none" },
      pulse: [],
    },
    /* 1 · intro · Dm */
    {
      section: "intro",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: ["D2", "A2"], vel: 0.35, swell: "in" },
      pulse: [],
    },
    /* 2 · intro · Dm */
    {
      section: "intro",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [
        { beat: 0, note: "D2", dur: 3, vel: 0.5 },
        { beat: 3, note: "F2", dur: 1, vel: 0.38 },
      ],
      whistle: [],
      strings: { notes: ["D2", "A2", "F3"], vel: 0.42, swell: "hold" },
      pulse: [],
    },
    /* 3 · intro · A */
    {
      section: "intro",
      chord: "A",
      chord_tones: ["A", "C#", "E"],
      lead: [],
      low: [
        { beat: 0, note: "A2", dur: 2.5, vel: 0.5 },
        { beat: 2.5, note: "C#3", dur: 1.5, vel: 0.4 },
      ],
      whistle: [],
      strings: { notes: ["A2", "E3", "C#4"], vel: 0.45, swell: "hold" },
      pulse: [],
    },
    /* 4 · statement · Dm */
    {
      section: "statement",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "A3", dur: 1, vel: 0.6 },
        { beat: 1, note: "F4", dur: 2, vel: 0.8, tremolo: true, slide: true },
        { beat: 3, note: "E4", dur: 0.5, vel: 0.55 },
        { beat: 3.5, note: "D4", dur: 0.5, vel: 0.6 },
      ],
      low: [
        { beat: 0, note: "D3", dur: 2, vel: 0.55 },
        { beat: 2, note: "C3", dur: 1, vel: 0.42 },
        { beat: 3, note: "A2", dur: 1, vel: 0.42 },
      ],
      whistle: [],
      strings: { notes: ["D2", "A2", "F3"], vel: 0.45, swell: "hold" },
      pulse: [],
    },
    /* 5 · statement · Bb */
    {
      section: "statement",
      chord: "Bb",
      chord_tones: ["Bb", "D", "F"],
      lead: [
        { beat: 0, note: "Bb3", dur: 2.5, vel: 0.7, tremolo: true },
      ],
      low: [
        { beat: 0, note: "Bb2", dur: 2, vel: 0.52 },
        { beat: 2, note: "F2", dur: 2, vel: 0.42 },
      ],
      whistle: [],
      strings: { notes: ["Bb2", "D3", "F3"], vel: 0.48, swell: "hold" },
      pulse: [],
    },
    /* 6 · statement · Gm */
    {
      section: "statement",
      chord: "Gm",
      chord_tones: ["G", "Bb", "D"],
      lead: [],
      low: [
        { beat: 0, note: "G2", dur: 2, vel: 0.5 },
        { beat: 2, note: "Bb2", dur: 1, vel: 0.4 },
        { beat: 3, note: "D3", dur: 1, vel: 0.42 },
      ],
      whistle: [
        { beat: 0.5, note: "Bb5", dur: 1, vel: 0.6 },
        { beat: 1.5, note: "A5", dur: 0.5, vel: 0.48 },
        { beat: 2, note: "G5", dur: 1.5, vel: 0.58 },
        { beat: 3.5, note: "D5", dur: 0.5, vel: 0.52 },
      ],
      strings: { notes: ["G2", "D3", "Bb3"], vel: 0.5, swell: "hold" },
      pulse: [],
    },
    /* 7 · statement · A */
    {
      section: "statement",
      chord: "A",
      chord_tones: ["A", "C#", "E"],
      lead: [
        { beat: 2.5, note: "C#4", dur: 0.5, vel: 0.5 },
        { beat: 3, note: "E4", dur: 1, vel: 0.6, tremolo: true },
      ],
      low: [
        { beat: 0, note: "A2", dur: 2, vel: 0.52 },
        { beat: 2, note: "E2", dur: 2, vel: 0.4 },
      ],
      whistle: [
        { beat: 0, note: "E5", dur: 2.5, vel: 0.55 },
      ],
      strings: { notes: ["A2", "E3", "C#4"], vel: 0.5, swell: "out" },
      pulse: [],
    },
    /* 8 · silence · Dm */
    {
      section: "silence",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: [], vel: 0, swell: "none" },
      pulse: [],
    },
    /* 9 · silence · Dm */
    {
      section: "silence",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: [], vel: 0, swell: "none" },
      pulse: [],
    },
    /* 10 · answer · Dm */
    {
      section: "answer",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "A3", dur: 1, vel: 0.55 },
        { beat: 1, note: "F4", dur: 1.5, vel: 0.72, tremolo: true },
        { beat: 2.5, note: "G4", dur: 0.5, vel: 0.5 },
        { beat: 3, note: "F4", dur: 1, vel: 0.58 },
      ],
      low: [
        { beat: 0, note: "D3", dur: 1.5, vel: 0.5 },
        { beat: 1.5, note: "A2", dur: 0.5, vel: 0.38 },
        { beat: 2, note: "F2", dur: 2, vel: 0.44 },
      ],
      whistle: [],
      strings: { notes: ["D2", "A2"], vel: 0.38, swell: "in" },
      pulse: [],
    },
    /* 11 · answer · C */
    {
      section: "answer",
      chord: "C",
      chord_tones: ["C", "E", "G"],
      lead: [
        { beat: 0, note: "E4", dur: 1, vel: 0.6 },
        { beat: 1, note: "C5", dur: 1.5, vel: 0.78, tremolo: true },
        { beat: 2.5, note: "Bb4", dur: 0.5, vel: 0.5 },
        { beat: 3, note: "A4", dur: 0.5, vel: 0.5 },
        { beat: 3.5, note: "G4", dur: 0.5, vel: 0.55 },
      ],
      low: [
        { beat: 0, note: "C3", dur: 1, vel: 0.5 },
        { beat: 1, note: "G2", dur: 1, vel: 0.42 },
        { beat: 2, note: "E2", dur: 2, vel: 0.44 },
      ],
      whistle: [],
      strings: { notes: ["C3", "E3", "G3"], vel: 0.45, swell: "hold" },
      pulse: [],
    },
    /* 12 · answer · Bb */
    {
      section: "answer",
      chord: "Bb",
      chord_tones: ["Bb", "D", "F"],
      lead: [],
      low: [
        { beat: 0, note: "Bb2", dur: 3, vel: 0.48 },
        { beat: 3, note: "G2", dur: 1, vel: 0.4 },
      ],
      whistle: [
        { beat: 0.5, note: "Bb5", dur: 1, vel: 0.55 },
        { beat: 1.5, note: "A5", dur: 0.5, vel: 0.45 },
        { beat: 2, note: "F5", dur: 1.5, vel: 0.52 },
        { beat: 3.5, note: "D5", dur: 0.5, vel: 0.48 },
      ],
      strings: { notes: ["Bb2", "D3", "F3"], vel: 0.5, swell: "hold" },
      pulse: [],
    },
    /* 13 · answer · A7 */
    {
      section: "answer",
      chord: "A7",
      chord_tones: ["A", "C#", "E", "G"],
      lead: [
        { beat: 0, note: "E4", dur: 2, vel: 0.68, tremolo: true },
        { beat: 2, note: "C#4", dur: 1, vel: 0.55 },
        { beat: 3, note: "A3", dur: 1, vel: 0.5 },
      ],
      low: [
        { beat: 0, note: "A2", dur: 1.5, vel: 0.52 },
        { beat: 1.5, note: "E2", dur: 0.5, vel: 0.38 },
        { beat: 2, note: "G2", dur: 2, vel: 0.44 },
      ],
      whistle: [],
      strings: { notes: ["A2", "E3", "G3", "C#4"], vel: 0.52, swell: "hold" },
      pulse: [],
    },
    /* 14 · answer · Dm/F */
    {
      section: "answer",
      chord: "Dm/F",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [
        { beat: 0, note: "F2", dur: 1, vel: 0.5 },
        { beat: 1, note: "A2", dur: 1, vel: 0.4 },
        { beat: 2, note: "D3", dur: 2, vel: 0.42 },
      ],
      whistle: [
        { beat: 0.5, note: "F5", dur: 1, vel: 0.55 },
        { beat: 1.5, note: "E5", dur: 0.5, vel: 0.45 },
        { beat: 2, note: "D5", dur: 2, vel: 0.5 },
      ],
      strings: { notes: ["F2", "A2", "D3"], vel: 0.5, swell: "hold" },
      pulse: [],
    },
    /* 15 · answer · A */
    {
      section: "answer",
      chord: "A",
      chord_tones: ["A", "C#", "E"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: ["A2", "E3", "C#4"], vel: 0.55, swell: "in" },
      pulse: [0],
    },
    /* 16 · build · Dm */
    {
      section: "build",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "A3", dur: 1, vel: 0.62 },
        { beat: 1, note: "F4", dur: 1.5, vel: 0.8, tremolo: true, slide: true },
        { beat: 2.5, note: "G4", dur: 0.5, vel: 0.55 },
        { beat: 3, note: "A4", dur: 1, vel: 0.68 },
      ],
      low: [
        { beat: 0, note: "D3", dur: 1, vel: 0.55 },
        { beat: 1, note: "C3", dur: 1, vel: 0.45 },
        { beat: 2, note: "A2", dur: 1, vel: 0.45 },
        { beat: 3, note: "F2", dur: 1, vel: 0.45 },
      ],
      whistle: [],
      strings: { notes: ["D2", "A2", "F3"], vel: 0.58, swell: "hold" },
      pulse: [],
    },
    /* 17 · build · Bbmaj7 */
    {
      section: "build",
      chord: "Bbmaj7",
      chord_tones: ["Bb", "D", "F", "A"],
      lead: [
        { beat: 0, note: "Bb4", dur: 1, vel: 0.78, tremolo: true },
        { beat: 1, note: "A4", dur: 0.5, vel: 0.55 },
        { beat: 1.5, note: "G4", dur: 0.5, vel: 0.52 },
        { beat: 2, note: "F4", dur: 1, vel: 0.62 },
        { beat: 3, note: "D4", dur: 1, vel: 0.58 },
      ],
      low: [
        { beat: 0, note: "Bb2", dur: 2, vel: 0.55 },
        { beat: 2, note: "C3", dur: 1, vel: 0.45 },
        { beat: 3, note: "D3", dur: 1, vel: 0.48 },
      ],
      whistle: [],
      strings: { notes: ["Bb2", "D3", "A3"], vel: 0.6, swell: "hold" },
      pulse: [],
    },
    /* 18 · build · Eb */
    {
      section: "build",
      chord: "Eb",
      chord_tones: ["Eb", "G", "Bb"],
      lead: [],
      low: [
        { beat: 0, note: "Eb3", dur: 2, vel: 0.55 },
        { beat: 2, note: "Bb2", dur: 1, vel: 0.45 },
        { beat: 3, note: "G2", dur: 1, vel: 0.45 },
      ],
      whistle: [
        { beat: 0.5, note: "Eb5", dur: 1, vel: 0.55 },
        { beat: 1.5, note: "F5", dur: 0.5, vel: 0.48 },
        { beat: 2, note: "G5", dur: 2, vel: 0.6 },
      ],
      strings: { notes: ["Eb2", "Bb2", "G3"], vel: 0.66, swell: "in" },
      pulse: [0],
    },
    /* 19 · build · A7 */
    {
      section: "build",
      chord: "A7",
      chord_tones: ["A", "C#", "E", "G"],
      lead: [
        { beat: 0, note: "E4", dur: 1, vel: 0.66 },
        { beat: 1, note: "C#5", dur: 2, vel: 0.85, tremolo: true },
        { beat: 3, note: "A4", dur: 1, vel: 0.65 },
      ],
      low: [
        { beat: 0, note: "A2", dur: 1, vel: 0.58 },
        { beat: 1, note: "G2", dur: 1, vel: 0.45 },
        { beat: 2, note: "E2", dur: 2, vel: 0.48 },
      ],
      whistle: [],
      strings: { notes: ["A2", "E3", "G3", "C#4"], vel: 0.7, swell: "hold" },
      pulse: [],
    },
    /* 20 · build · Gm */
    {
      section: "build",
      chord: "Gm",
      chord_tones: ["G", "Bb", "D"],
      lead: [],
      low: [
        { beat: 0, note: "G2", dur: 1.5, vel: 0.58 },
        { beat: 1.5, note: "D3", dur: 0.5, vel: 0.42 },
        { beat: 2, note: "Bb2", dur: 1, vel: 0.48 },
        { beat: 3, note: "G2", dur: 1, vel: 0.45 },
      ],
      whistle: [
        { beat: 0.5, note: "Bb5", dur: 1, vel: 0.62 },
        { beat: 1.5, note: "A5", dur: 0.5, vel: 0.5 },
        { beat: 2, note: "G5", dur: 1, vel: 0.6 },
        { beat: 3, note: "F5", dur: 0.5, vel: 0.5 },
        { beat: 3.5, note: "D5", dur: 0.5, vel: 0.55 },
      ],
      strings: { notes: ["G2", "D3", "Bb3"], vel: 0.72, swell: "hold" },
      pulse: [],
    },
    /* 21 · build · Dm/F */
    {
      section: "build",
      chord: "Dm/F",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "D5", dur: 1, vel: 0.8 },
        { beat: 1, note: "F4", dur: 2, vel: 0.72, tremolo: true },
        { beat: 3, note: "G4", dur: 0.5, vel: 0.55 },
        { beat: 3.5, note: "A4", dur: 0.5, vel: 0.62 },
      ],
      low: [
        { beat: 0, note: "F2", dur: 1.5, vel: 0.58 },
        { beat: 1.5, note: "A2", dur: 0.5, vel: 0.45 },
        { beat: 2, note: "D3", dur: 1, vel: 0.5 },
        { beat: 3, note: "C3", dur: 1, vel: 0.48 },
      ],
      whistle: [],
      strings: { notes: ["F2", "A2", "D3"], vel: 0.76, swell: "hold" },
      pulse: [],
    },
    /* 22 · build · Bb */
    {
      section: "build",
      chord: "Bb",
      chord_tones: ["Bb", "D", "F"],
      lead: [
        { beat: 0, note: "Bb4", dur: 1.5, vel: 0.75 },
        { beat: 1.5, note: "C5", dur: 0.5, vel: 0.6 },
        { beat: 2, note: "D5", dur: 2, vel: 0.85, tremolo: true },
      ],
      low: [
        { beat: 0, note: "Bb2", dur: 1, vel: 0.6 },
        { beat: 1, note: "A2", dur: 1, vel: 0.48 },
        { beat: 2, note: "G2", dur: 1, vel: 0.5 },
        { beat: 3, note: "F2", dur: 1, vel: 0.5 },
      ],
      whistle: [],
      strings: { notes: ["D3", "F3", "Bb3"], vel: 0.8, swell: "in" },
      pulse: [],
    },
    /* 23 · build · Asus4-A */
    {
      section: "build",
      chord: "Asus4-A",
      chord_tones: ["A", "D", "E", "C#"],
      lead: [
        { beat: 0, note: "D5", dur: 2, vel: 0.88, tremolo: true },
        { beat: 2, note: "C#5", dur: 2, vel: 0.82, tremolo: true },
      ],
      low: [
        { beat: 0, note: "A2", dur: 2, vel: 0.62 },
        { beat: 2, note: "E2", dur: 2, vel: 0.52 },
      ],
      whistle: [],
      strings: { notes: ["A2", "E3", "A3"], vel: 0.85, swell: "hold" },
      pulse: [0],
    },
    /* 24 · build · A */
    {
      section: "build",
      chord: "A",
      chord_tones: ["A", "C#", "E"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: ["A2", "E3", "C#4"], vel: 0.88, swell: "in" },
      pulse: [0, 2],
    },
    /* 25 · peak · Dm */
    {
      section: "peak",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "A4", dur: 1, vel: 0.85 },
        { beat: 1, note: "F5", dur: 2, vel: 1, tremolo: true, slide: true },
        { beat: 3, note: "E5", dur: 0.5, vel: 0.72 },
        { beat: 3.5, note: "D5", dur: 0.5, vel: 0.75 },
      ],
      low: [
        { beat: 0, note: "D2", dur: 1, vel: 0.72 },
        { beat: 1, note: "A2", dur: 1, vel: 0.58 },
        { beat: 2, note: "D3", dur: 1, vel: 0.62 },
        { beat: 3, note: "F3", dur: 1, vel: 0.58 },
      ],
      whistle: [],
      strings: { notes: ["D2", "A2", "D3", "F3"], vel: 0.95, swell: "hold" },
      pulse: [0],
    },
    /* 26 · peak · Bb/D */
    {
      section: "peak",
      chord: "Bb/D",
      chord_tones: ["Bb", "D", "F"],
      lead: [
        { beat: 0, note: "Bb4", dur: 2, vel: 0.85 },
      ],
      low: [
        { beat: 0, note: "D3", dur: 2, vel: 0.65 },
        { beat: 2, note: "C3", dur: 1, vel: 0.5 },
        { beat: 3, note: "Bb2", dur: 1, vel: 0.52 },
      ],
      whistle: [
        { beat: 2.5, note: "D6", dur: 1, vel: 0.62 },
        { beat: 3.5, note: "C6", dur: 0.5, vel: 0.5 },
      ],
      strings: { notes: ["D3", "F3", "Bb3"], vel: 0.95, swell: "hold" },
      pulse: [],
    },
    /* 27 · peak · Gm */
    {
      section: "peak",
      chord: "Gm",
      chord_tones: ["G", "Bb", "D"],
      lead: [],
      low: [
        { beat: 0, note: "G2", dur: 1.5, vel: 0.65 },
        { beat: 1.5, note: "Bb2", dur: 0.5, vel: 0.5 },
        { beat: 2, note: "D3", dur: 2, vel: 0.58 },
      ],
      whistle: [
        { beat: 0, note: "Bb5", dur: 1.5, vel: 0.7 },
        { beat: 1.5, note: "A5", dur: 0.5, vel: 0.55 },
        { beat: 2, note: "G5", dur: 1.5, vel: 0.65 },
      ],
      strings: { notes: ["G2", "D3", "Bb3"], vel: 1, swell: "hold" },
      pulse: [0],
    },
    /* 28 · peak · A/C# */
    {
      section: "peak",
      chord: "A/C#",
      chord_tones: ["A", "C#", "E"],
      lead: [
        { beat: 2.5, note: "C#5", dur: 0.5, vel: 0.72 },
        { beat: 3, note: "E5", dur: 1, vel: 0.85 },
      ],
      low: [
        { beat: 0, note: "C#3", dur: 1, vel: 0.65 },
        { beat: 1, note: "A2", dur: 1, vel: 0.55 },
        { beat: 2, note: "E2", dur: 1, vel: 0.55 },
        { beat: 3, note: "A2", dur: 1, vel: 0.52 },
      ],
      whistle: [
        { beat: 0, note: "A5", dur: 2, vel: 0.65 },
      ],
      strings: { notes: ["A2", "E3", "C#4"], vel: 1, swell: "hold" },
      pulse: [],
    },
    /* 29 · peak · Dm */
    {
      section: "peak",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "F5", dur: 1.5, vel: 1, tremolo: true },
        { beat: 1.5, note: "E5", dur: 0.5, vel: 0.72 },
        { beat: 2, note: "D5", dur: 1, vel: 0.85 },
        { beat: 3, note: "C5", dur: 0.5, vel: 0.62 },
        { beat: 3.5, note: "A4", dur: 0.5, vel: 0.66 },
      ],
      low: [
        { beat: 0, note: "D3", dur: 2, vel: 0.7 },
        { beat: 2, note: "C3", dur: 1, vel: 0.55 },
        { beat: 3, note: "Bb2", dur: 1, vel: 0.55 },
      ],
      whistle: [],
      strings: { notes: ["D2", "D3", "F3", "A3"], vel: 1, swell: "hold" },
      pulse: [0, 2],
    },
    /* 30 · peak · A */
    {
      section: "peak",
      chord: "A",
      chord_tones: ["A", "C#", "E"],
      lead: [
        { beat: 0, note: "E5", dur: 1, vel: 0.82 },
        { beat: 1, note: "C#5", dur: 1, vel: 0.72 },
        { beat: 2, note: "A4", dur: 1, vel: 0.75 },
      ],
      low: [
        { beat: 0, note: "A2", dur: 2, vel: 0.62 },
        { beat: 2, note: "E2", dur: 2, vel: 0.5 },
      ],
      whistle: [
        { beat: 3, note: "A5", dur: 1, vel: 0.55 },
      ],
      strings: { notes: ["A2", "E3", "C#4"], vel: 0.85, swell: "out" },
      pulse: [0],
    },
    /* 31 · silence · A */
    {
      section: "silence",
      chord: "A",
      chord_tones: ["A", "C#", "E"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: [], vel: 0, swell: "none" },
      pulse: [],
    },
    /* 32 · release · Dm */
    {
      section: "release",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "F4", dur: 1.5, vel: 0.55, tremolo: true },
        { beat: 1.5, note: "E4", dur: 0.5, vel: 0.42 },
        { beat: 2, note: "D4", dur: 2, vel: 0.48 },
      ],
      low: [
        { beat: 0, note: "D3", dur: 2, vel: 0.45 },
        { beat: 2, note: "A2", dur: 2, vel: 0.38 },
      ],
      whistle: [],
      strings: { notes: ["D2", "A2", "F3"], vel: 0.45, swell: "in" },
      pulse: [],
    },
    /* 33 · release · A/C# */
    {
      section: "release",
      chord: "A/C#",
      chord_tones: ["A", "C#", "E"],
      lead: [],
      low: [
        { beat: 0, note: "C#3", dur: 2.5, vel: 0.42 },
        { beat: 2.5, note: "A2", dur: 1.5, vel: 0.36 },
      ],
      whistle: [],
      strings: { notes: ["A2", "E3", "C#4"], vel: 0.42, swell: "hold" },
      pulse: [],
    },
    /* 34 · release · Dm7/C */
    {
      section: "release",
      chord: "Dm7/C",
      chord_tones: ["D", "F", "A", "C"],
      lead: [],
      low: [
        { beat: 0, note: "C3", dur: 2.5, vel: 0.42 },
        { beat: 2.5, note: "F2", dur: 1.5, vel: 0.36 },
      ],
      whistle: [
        { beat: 0, note: "A4", dur: 1, vel: 0.48 },
        { beat: 1, note: "F5", dur: 2, vel: 0.55 },
        { beat: 3, note: "E5", dur: 0.5, vel: 0.45 },
        { beat: 3.5, note: "D5", dur: 0.5, vel: 0.48 },
      ],
      strings: { notes: ["C3", "F3", "A3", "D4"], vel: 0.42, swell: "hold" },
      pulse: [],
    },
    /* 35 · release · Bbmaj7 */
    {
      section: "release",
      chord: "Bbmaj7",
      chord_tones: ["Bb", "D", "F", "A"],
      lead: [],
      low: [
        { beat: 0, note: "Bb2", dur: 3, vel: 0.4 },
        { beat: 3, note: "F2", dur: 1, vel: 0.34 },
      ],
      whistle: [],
      strings: { notes: ["Bb2", "D3", "A3"], vel: 0.4, swell: "hold" },
      pulse: [],
    },
    /* 36 · release · A */
    {
      section: "release",
      chord: "A",
      chord_tones: ["A", "C#", "E"],
      lead: [],
      low: [
        { beat: 0, note: "A2", dur: 2, vel: 0.4 },
        { beat: 2, note: "E2", dur: 2, vel: 0.34 },
      ],
      whistle: [],
      strings: { notes: ["A2", "E3", "C#4"], vel: 0.38, swell: "hold" },
      pulse: [],
    },
    /* 37 · release · Dm */
    {
      section: "release",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [
        { beat: 0, note: "A3", dur: 1, vel: 0.45 },
        { beat: 1, note: "F3", dur: 1, vel: 0.4 },
        { beat: 2, note: "D3", dur: 2, vel: 0.42 },
      ],
      low: [
        { beat: 0, note: "D2", dur: 4, vel: 0.42 },
      ],
      whistle: [],
      strings: { notes: ["D2", "A2", "F3"], vel: 0.4, swell: "out" },
      pulse: [],
    },
    /* 38 · silence · Dm */
    {
      section: "silence",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: [], vel: 0, swell: "none" },
      pulse: [],
    },
    /* 39 · silence · Dm */
    {
      section: "silence",
      chord: "Dm",
      chord_tones: ["D", "F", "A"],
      lead: [],
      low: [],
      whistle: [],
      strings: { notes: [], vel: 0, swell: "none" },
      pulse: [],
    },
  ],
  closing: [
    { beat: 0, note: "A2", dur: 2, vel: 0.45 },
    { beat: 0, note: "F4", dur: 1, vel: 0.55, tremolo: true },
    { beat: 1, note: "E4", dur: 0.5, vel: 0.45 },
    { beat: 1.5, note: "C#4", dur: 0.5, vel: 0.45 },
    { beat: 2, note: "D4", dur: 3, vel: 0.5, tremolo: true },
    { beat: 2, note: "D2", dur: 4, vel: 0.5 },
  ],
};

/*
  How the score is voiced.

  A `vel` of 1.0 in each voice is this level on the music bus. The lead is
  the loudest thing and the strings the quietest, and the whistle sits under
  the lead's peak on purpose: a held sine an octave above a guitar carries
  further than a pluck at the same number.

  The strings' figure is the whole pad, not each note of it. A chord of three
  pitches is three bowed voices, and uncorrelated voices add in power, so each
  is scaled by one over the square root of how many there are — a two-note
  bar and a four-note bar sit at the level the score gave them.
*/
const LEAD = 0.5;
const LOW = 0.34;
const WHISTLE = 0.36;
const STRINGS = 0.12;
/* The heartbeat: this in the answer and early build, rising to the peak's. */
const THUMP = 0.1;
const THUMP_PEAK = 0.16;
/* Camp and the Board: the same piece, further off, with nobody answering. */
const REFLECTIVE = 0.8;

/* Strikes per second in a tremolo — a right hand at speed, not a roll. */
const TREMOLO_RATE = 13;
/* A whole tone below, and how long `guitar()` takes to pull it up. The
   second number is the instrument's, repeated here because a tremolo slides
   every strike that lands inside it. */
const SLIDE = 0.891;
const SLIDE_TIME = 0.13;

/* The man a little right of centre, his low strings left of him, and the
   other voice off to the side and a long way away. */
const LEAD_PAN = 0.06;
const LOW_PAN = -0.14;
const WHISTLE_PAN = 0.3;

/* Beats for a new string to arrive and for a finished one to go, when
   nothing is changing under it: out of silence, into silence, or joining a
   chord that is staying. */
const PAD_SETTLE = 1.2;
const PAD_RELEASE = 1.2;
/*
  A change of chord is quicker, and centred on the barline rather than after
  it. The low pluck and the lead state the new harmony on the downbeat, so a
  pitch that is leaving starts to go PAD_LEAVE before the bar ends and is
  gone PAD_HANDOVER after it, and a pitch that is arriving is at level within
  PAD_ARRIVE. With the slow pair above, the old chord still outweighed the
  new one by 13 to 1 a quarter of a beat into the bar and did not cross it
  until 0.6 of a beat — half a second of the last bar's harmony against this
  bar's bass, at most of the barlines in the loop. With these, voice for
  voice, the old is at half its level on the downbeat, crosses the new at
  0.12 of a beat, and is a fifth of the new one's level by a quarter.
*/
const PAD_ARRIVE = 0.35;
const PAD_LEAVE = 0.35;
const PAD_HANDOVER = 0.35;

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
  /** The gap after each phrase, in beats. Ignored by a cue with a score. */
  rest: Record<MusicState, [number, number]>;
  /**
   * The written piece, if the cue is one.
   *
   * A cue without this is phrase-and-rest: the scheduler picks a figure,
   * rolls for a whistle and a reply, and rests. A cue with one is played as
   * written, bar by bar, and every field above is ignored — including the
   * drone, because a score brings its own strings. See the standoff cue for
   * why the second piece had to be written out rather than rolled.
   */
  score?: Score;
  /**
   * The way out.
   *
   * Played once when the visitor leaves for the territory, after which the
   * cue stops rather than fades — a cadence, not a crossfade. The brief asks
   * that nothing loop forever and for a short resolution on entering the
   * frontier; this is both, and it is the only part of either cue allowed to
   * sound finished. A cue with a score carries its own, in the score.
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

/* Every chance zero: a cue with a score never rolls for anything. */
const NEVER: Record<MusicState, number> = {
  silence: 0,
  sparse: 0,
  journey: 0,
  reflective: 0,
};

/*
  The phrase-and-rest fields are empty here, and never read: a cue with a
  score is played from the score. They stay rather than become optional so
  that Cue is one shape and the Frontier path needs no narrowing it has no use
  for.
*/
export const standoffCue: Cue = {
  beat: 60 / STANDOFF_SCORE.bpm,
  figures: [],
  whistles: [],
  voicings: [],
  roll: [],
  drone: { low: 0, high: 0, level: 0, quietLevel: 0 },
  whistleChance: NEVER,
  rollChance: NEVER,
  reedChance: NEVER,
  tremoloChance: NEVER,
  rest: { silence: [0, 0], sparse: [0, 0], journey: [0, 0], reflective: [0, 0] },
  closing: { beats: 0, notes: [] },
  score: STANDOFF_SCORE,
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
    The bar clock, for a cue with a score.

    Separate from the phrase cursor because a score counts bars rather than
    phrases and rests. `bar` is the index of the next bar to schedule; `step`
    counts every bar scheduled since the score last began, so a bar heard
    twice — the loop plays 10 to 39 over and over — is two different steps.
    The strings and the whistle look ahead by step, never by index.
  */
  let barCursor = context.currentTime + 0.4;
  let bar = 0;
  let step = 0;
  /* Set whenever the score has to begin again rather than carry on: at the
     start, after silence, after the cadence, and on a cue switch. Where it
     begins depends on the state it begins in. */
  let fresh = true;
  /* The strings sounding now, each with the last step it holds through. */
  let pads: Array<{ note: string; through: number; ends: number; voice: Sustained }> = [];
  /* Each step's rubato, drawn once: the strings plan whole bars ahead, and
     they must agree with the bar clock about how long those bars are. */
  const stretches = new Map<number, number>();
  /* Whistle notes a breath from the previous bar has already sung. */
  let carried = { step: -1, count: 0 };
  /* Where everything the score plays goes, other than its strings. */
  let take: GainNode | null = null;

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
    Letting a score go.

    Nothing a score schedules can be taken back one note at a time. The
    guitar, the whistle and the heartbeat are fire-and-forget, and the
    look-ahead always has up to two seconds of them queued. So all of them
    play into one gain, the take, and letting go means fading the take and
    dropping it: whatever was still queued plays into a node that is no
    longer connected to anything. A new take is made the next time the score
    plays a note.

    The strings are the exception, because they hold for bars at a time and
    have handles. They go straight to the bus and are released one by one,
    over their own length — the cadence lets them fade under it rather than
    cutting them with the notes it has just cancelled.
  */
  const hushScore = (seconds = 1.6, strings = seconds) => {
    for (const pad of pads) pad.voice.release(strings);
    pads = [];
    fresh = true;
    const old = take;
    if (!old) return;
    take = null;
    const now = context.currentTime;
    try {
      old.gain.cancelScheduledValues(now);
      old.gain.setValueAtTime(old.gain.value, now);
      old.gain.linearRampToValueAtTime(0, now + seconds);
    } catch {
      /* A context that is closing. */
    }
    window.setTimeout(() => old.disconnect(), seconds * 1000 + 100);
  };

  const ensureTake = (): GainNode => {
    if (!take) {
      take = context.createGain();
      take.connect(desk.bus.music);
    }
    return take;
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

    /* A score brings its own strings, so there is no drone under it. */
    if (cue.score) {
      playScore(cue.score);
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
      cursor = playPhrase(cursor);
    }
  };

  /**
   * One phrase, and whatever answers it. Returns where the next one may start.
   *
   * Only a cue without a score comes through here. The octave double that
   * used to be an optional second argument went with the lo-fi cue, its only
   * caller; it defaulted to off and drew no random numbers when off, so the
   * Frontier cue plays exactly the notes it did.
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

        No cue that comes through here uses it now: the Frontier cue's chance
        is zero, and the standoff cue's tremolo is written into its score and
        played by `tremolo()` below, on the notes the score marks.
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

  /* =======================================================================
     THE SCORE PLAYER

     Everything below is for a cue with a score, and it has one rule: the
     structure is the score's and the surface is the player's. Which note, in
     which bar, on which beat, for how long and how loud is read from the
     page. What is left to chance is only what a person playing that page
     would vary without meaning to — a few milliseconds either side of the
     beat, a tenth either side of the written dynamic, a phrase's last beat
     held a little long.
     ======================================================================= */

  /** Uniformly within `amount` either side of zero. */
  const rough = (amount: number) => (Math.random() * 2 - 1) * amount;

  /** A dynamic, varied by up to `amount` of itself. */
  const vary = (amount: number) => 1 + rough(amount);

  const nextBar = (score: Score, i: number) =>
    i + 1 < score.bars.length ? i + 1 : score.loop_from_bar;

  /*
    A bar that closes a phrase: something was said in it, and after it either
    the section changes or nobody speaks. Its last beat may stretch, and its
    last notes are let ring.
  */
  const endsPhrase = (score: Score, i: number) => {
    const here = score.bars[i];
    if (here.lead.length === 0 && here.whistle.length === 0) return false;
    const next = score.bars[nextBar(score, i)];
    return (
      next.section !== here.section ||
      (next.lead.length === 0 && next.whistle.length === 0)
    );
  };

  /* The rubato: two to four percent on the last beat of a phrase-ending bar,
     none anywhere else. Drawn once per step and remembered. */
  const stretchAt = (score: Score, s: number, i: number) => {
    let stretch = stretches.get(s);
    if (stretch === undefined) {
      stretch = endsPhrase(score, i) ? 1.02 + Math.random() * 0.02 : 1;
      stretches.set(s, stretch);
    }
    return stretch;
  };

  /** Beats from the top of a bar to seconds, with its last beat stretched. */
  const seconds = (beat: number, stretch: number, B: number) =>
    (beat <= 3 ? beat : 3 + (beat - 3) * stretch) * B;

  /* The heartbeat's level: quiet through the answer, rising across the build,
     loudest in the peak. It follows the section, never the bar number, so it
     stays right if the score is edited. */
  const pulseLevel = (score: Score, i: number) => {
    const section = score.bars[i].section;
    if (section === "peak") return THUMP_PEAK;
    if (section !== "build") return THUMP;
    const first = score.bars.findIndex((b) => b.section === "build");
    let last = first;
    while (score.bars[last + 1]?.section === "build") last += 1;
    const along = (i - first) / Math.max(1, last - first);
    return THUMP + (THUMP_PEAK - THUMP) * 0.75 * along;
  };

  /**
   * The score's bar clock: every bar that starts inside the look-ahead.
   *
   * Where it starts is the state's business. Sparse, and anything else
   * arriving from silence, begins at the top — the wind, then the strings,
   * then one low note. Journey arriving from silence begins at the build,
   * because a visitor who is already moving should not have to sit through
   * the introduction. Any state reached from another playing state carries on
   * from wherever the piece has got to.
   */
  function playScore(score: Score): void {
    const B = 60 / score.bpm;
    const now = context.currentTime;
    if (fresh) {
      fresh = false;
      const build = score.bars.findIndex((b) => b.section === "build");
      bar = state === "journey" && build >= 0 ? build : 0;
      step = 0;
      stretches.clear();
      carried = { step: -1, count: 0 };
      barCursor = now + 0.4;
    }
    /* A throttled tab can wake the timer late. Better to lose a moment than to
       play every overdue note at once. */
    if (barCursor < now) barCursor = now + 0.1;
    pads = pads.filter((pad) => pad.ends > now);

    while (barCursor < now + LOOKAHEAD) {
      const stretch = stretchAt(score, step, bar);
      playBar(score, bar, step, barCursor, stretch, B);
      stretches.delete(step - 1);
      barCursor += seconds(4, stretch, B);
      bar = nextBar(score, bar);
      step += 1;
    }
  }

  function playBar(
    score: Score,
    i: number,
    s: number,
    start: number,
    stretch: number,
    B: number,
  ): void {
    const b = score.bars[i];
    const out = ensureTake();
    /* Camp and the Board: lead, low and strings, further off. Nobody answers
       and there is no heartbeat — the fire is the only pulse there. */
    const reflective = state === "reflective";
    const scale = reflective ? REFLECTIVE : 1;
    const closes = endsPhrase(score, i);
    const at = (beat: number) => start + seconds(beat, stretch, B);

    /* The man. */
    b.lead.forEach((n, k) => {
      let lean = rough(0.012);
      /* A held tremolo after the downbeat lands a hair late, as if he
         hesitates before committing to it. */
      if (n.tremolo && n.dur >= 1.5 && n.beat > 0) lean += 0.01 + Math.random() * 0.012;
      /* The climax is the opposite: the loudest downbeat of the peak comes a
         hair early, as if he cannot wait for it. */
      if (b.section === "peak" && n.beat === 0 && n.vel >= 0.95) lean -= 0.014;
      playLead(out, n, {
        when: at(n.beat) + lean,
        length: at(n.beat + n.dur) - at(n.beat),
        level: LEAD * n.vel * vary(0.1) * scale,
        final: closes && k === b.lead.length - 1,
      });
    });

    /* The low plucks: the thumb, warmer than the lead because it is picked
       softer. The two weak beats of the bar are softer again and a little
       less even, which is where a thumb that is not counting drifts. */
    for (const n of b.low) {
      const weak = n.beat >= 2;
      guitar(context, out, {
        frequency: hz(n.note),
        decay: at(n.beat + n.dur) - at(n.beat) + 0.25,
        attack: 0.12 + n.vel * 0.26,
        level: LOW * n.vel * (weak ? 0.9 : 1) * vary(weak ? 0.14 : 0.1) * scale,
        pan: LOW_PAN + rough(0.03),
        when: at(n.beat) + rough(weak ? 0.012 : 0.008),
      });
    }

    if (!reflective) {
      playWhistle(score, i, s, start, stretch, B, out, closes);
      /* The heartbeat. The second of a pair is the softer, so two in a bar
         are one heart and not a drum part. */
      b.pulse.forEach((beat, k) => {
        thump(context, out, {
          level: pulseLevel(score, i) * (k > 0 ? 0.8 : 1) * vary(0.08),
          pan: 0,
          when: at(beat) + rough(0.006),
        });
      });
    }

    playStrings(score, i, s, start, B, scale);
  }

  /*
    A lead note: one pluck, or a tremolo.

    A pluck rings for its written length and a short tail, not the two or
    three seconds the Frontier cue lets its notes ring. The whistle answers
    into the gaps the guitar leaves, and a gap full of the last note's decay
    is not a gap. The last note of a phrase is the exception: it is allowed to
    linger, because nothing follows it.
  */
  function playLead(
    out: AudioNode,
    n: ScoreNote,
    {
      when,
      length,
      level,
      final,
    }: { when: number; length: number; level: number; final: boolean },
  ): void {
    const frequency = hz(n.note);
    if (n.tremolo) {
      tremolo(out, {
        frequency,
        length,
        level,
        vel: n.vel,
        when,
        slide: n.slide === true,
        tail: final ? 0.6 : 0.25,
        thin: 0.3,
      });
      return;
    }
    guitar(context, out, {
      frequency,
      slideFrom: n.slide ? SLIDE : undefined,
      decay: length + (final ? 0.7 : 0.3),
      attack: Math.min(1, (0.3 + n.vel * 0.45) * vary(0.08)),
      level,
      pan: LEAD_PAN + rough(0.04),
      when,
    });
  }

  /*
    Tremolo, as written: one string struck about thirteen times a second for
    exactly the note's length.

    The strike rate is fitted to the length rather than fixed, so the last
    strike lands inside the note and never over the next one. Each strike is
    a fresh pluck with a short ring, so the note is made of attacks the way a
    real tremolo is, and it thins as it goes — quieter and darker, the
    upstrokes lighter than the downstrokes, as a hand at speed is.

    A slide belongs to the note, not to its first strike. Every strike that
    lands while the finger is still moving starts from wherever the finger
    has got to, so the pitch rises once through the strikes rather than
    restarting at each.
  */
  function tremolo(
    out: AudioNode,
    {
      frequency,
      length,
      level,
      vel,
      when,
      slide,
      tail,
      thin,
    }: {
      frequency: number;
      length: number;
      level: number;
      vel: number;
      when: number;
      slide: boolean;
      tail: number;
      thin: number;
    },
  ): void {
    const strikes = Math.max(2, Math.round(length * TREMOLO_RATE));
    const gap = length / strikes;
    for (let i = 0; i < strikes; i += 1) {
      const into = i * gap;
      const fade = 1 - thin * (i / strikes);
      const up = i % 2 === 1;
      const last = i === strikes - 1;
      guitar(context, out, {
        frequency,
        slideFrom:
          slide && into < SLIDE_TIME ? SLIDE ** (1 - into / SLIDE_TIME) : undefined,
        decay: last ? gap + tail : gap * 2.6,
        attack: Math.min(1, (0.25 + vel * 0.45) * fade * (up ? 0.85 : 1)),
        /* The first strike carries the accent; the rest ring over one
           another, so each sits well under the note's written level. */
        level: level * (i === 0 ? 0.78 : 0.62) * fade * (up ? 0.88 : 1) * vary(0.06),
        pan: LEAD_PAN + rough(0.02),
        when: when + into + (i === 0 ? 0 : rough(0.004)),
      });
    }
  }

  /*
    The whistle: one breath per phrase, placed in beats.

    This is the sync fix. A breath is every note up to a rest of half a beat
    or more, sung as one whistle() call so the pitch slides between them the
    way a person's does — and every one of its notes is at a written beat,
    converted through the same bar clock as the guitar. The only thing added
    is a lean behind the grid of up to thirty milliseconds, because the
    whistler is a long way off and sound takes time to cross a valley.

    A breath still going at the barline carries on into the next bar: the
    score's whistle sings across the bar twice, and two calls there would be
    somebody drawing breath in the middle of a line. The notes it takes from
    the next bar are counted, and that bar skips them.
  */
  function playWhistle(
    score: Score,
    i: number,
    s: number,
    start: number,
    stretch: number,
    B: number,
    out: AudioNode,
    closes: boolean,
  ): void {
    const skip = carried.step === s ? carried.count : 0;
    const own = score.bars[i].whistle.slice(skip);
    if (own.length === 0) return;

    type Sung = { from: number; to: number; note: number; vel: number };
    const breaths: Sung[][] = [];
    let edge = -Infinity;
    for (const n of own) {
      if (n.beat - edge >= 0.5) breaths.push([]);
      breaths[breaths.length - 1].push({
        from: seconds(n.beat, stretch, B),
        to: seconds(n.beat + n.dur, stretch, B),
        note: hz(n.note),
        vel: n.vel,
      });
      edge = n.beat + n.dur;
    }

    if (edge >= 4) {
      const j = nextBar(score, i);
      const length = seconds(4, stretch, B);
      const onward = stretchAt(score, s + 1, j);
      let reach = 0;
      let count = 0;
      for (const n of score.bars[j].whistle) {
        if (n.beat - reach >= 0.5) break;
        breaths[breaths.length - 1].push({
          from: length + seconds(n.beat, onward, B),
          to: length + seconds(n.beat + n.dur, onward, B),
          note: hz(n.note),
          vel: n.vel,
        });
        reach = n.beat + n.dur;
        count += 1;
      }
      if (count > 0) carried = { step: s + 1, count };
    }

    breaths.forEach((line, k) => {
      const first = line[0].from;
      const tail = line.length - 1;
      const linger = closes && k === breaths.length - 1 ? 1.12 : 1;
      const mean = line.reduce((sum, n) => sum + n.vel, 0) / line.length;
      whistle(context, out, {
        notes: line.map((n, idx) => ({
          at: idx === 0 ? 0 : n.from - first + rough(0.008),
          note: n.note,
          hold: (n.to - n.from) * (idx === tail ? linger : 1),
        })),
        level: WHISTLE * mean * vary(0.1),
        pan: WHISTLE_PAN + rough(0.08),
        when: start + first + 0.015 + rough(0.015),
        /* The strings under it are tuned exactly and often hold the very
           pitch the whistle lands on, so a quarter-tone of drift reads as
           out of tune rather than human. Within 6 cents, and a sag of about
           a sixth of a semitone at the end of a breath. */
        offPitch: 6,
        sag: 0.99,
      });
    });
  }

  /*
    The strings: one bowed voice per pitch, held for as long as the score
    keeps that pitch.

    A pitch that carries into the next bar is not bowed again. When a pitch
    first appears, the score is read forward, bar by bar, for as long as the
    pitch stays in the chord, and one bow() covers the whole run with its
    level drawn bar by bar: `in` rises to the bar's level at the barline,
    `hold` settles on it within a beat and stays, `out` falls to half of
    wherever it started. At a change of chord, a pitch that leaves starts to
    fade a third of a beat before the barline and is gone a third after it,
    while the new chord's pitches reach their level within a third of a beat
    — so the change is a crossfade centred on the downbeat, where the bass
    and the lead change, and never a gap. Out of silence and into it the
    strings take a beat and more, because nothing is changing under them.

    Every voice is kept with the last step it covers, so the bars it spans
    know it is already sounding, and so silence, a cue switch or the cadence
    can release it.
  */
  function playStrings(
    score: Score,
    i: number,
    s: number,
    start: number,
    B: number,
    scale: number,
  ): void {
    const pitches = score.bars[i].strings.notes;
    /* A pitch held through the last step and not this one is leaving at this
       barline, so whatever arrives here is taking over from a chord. */
    const changing = pads.some((pad) => pad.through === s - 1);
    pitches.forEach((pitch, j) => {
      if (pads.some((pad) => pad.note === pitch && pad.through >= s)) return;

      const contour: Array<{ at: number; level: number }> = [];
      let idx = i;
      let st = s;
      let offset = 0;
      let level = 0;
      let bars = 0;
      while (bars < score.bars.length && score.bars[idx].strings.notes.includes(pitch)) {
        const { strings } = score.bars[idx];
        const length = seconds(4, stretchAt(score, st, idx), B);
        const target = (STRINGS * strings.vel * scale) / Math.sqrt(strings.notes.length);
        const settle =
          bars === 0 && changing
            ? PAD_ARRIVE * B
            : Math.min(length * 0.5, PAD_SETTLE * B);
        if (strings.swell === "in") {
          contour.push({ at: offset + length, level: target });
          level = target;
        } else if (strings.swell === "out") {
          /* Never rising into a fade: a bar marked out that follows a
             quieter one starts from where that one left off. */
          const head = level > 0 ? Math.min(target, level) : target;
          contour.push({ at: offset + settle, level: head });
          contour.push({ at: offset + length, level: head * 0.5 });
          level = head * 0.5;
        } else {
          contour.push({ at: offset + settle, level: target });
          contour.push({ at: offset + length, level: target });
          level = target;
        }
        offset += length;
        idx = nextBar(score, idx);
        st += 1;
        bars += 1;
      }

      /* Where the run ends. Into another chord, the pitch starts to go just
         before the barline and is gone just after it; into silence, it takes
         its time. */
      let duration = offset + PAD_RELEASE * B;
      if (score.bars[idx].strings.notes.length > 0) {
        const last = contour[contour.length - 1];
        const before = contour.length > 1 ? contour[contour.length - 2].at : 0;
        last.at = Math.max(before + 0.05, offset - PAD_LEAVE * B);
        duration = offset + PAD_HANDOVER * B;
      }
      pads.push({
        note: pitch,
        through: s + bars - 1,
        ends: start + duration,
        voice: bow(context, desk.bus.music, {
          frequency: hz(pitch),
          duration,
          contour,
          /* Open-voiced, and spread: the lowest pitch left, the highest right. */
          pan: (j - (pitches.length - 1) / 2) * 0.22,
          when: start,
        }),
      });
    });
  }

  /*
    The score's way out.

    Notes below D3 are low plucks and everything else is the lead, as the
    score's conventions say. Longer tails than anywhere in the piece — this is
    the one place it is allowed to sound finished — and the closing tremolo
    thins much further than the piece's own, so the last held note dies away
    rather than stopping.
  */
  function playClosing(score: Score, at: number): void {
    const B = 60 / score.bpm;
    const out = ensureTake();
    const floor = hz("D3");
    for (const n of score.closing) {
      const frequency = hz(n.note);
      const when = at + n.beat * B + rough(0.01);
      const length = n.dur * B;
      if (frequency < floor) {
        guitar(context, out, {
          frequency,
          decay: length + 0.8,
          attack: 0.12 + n.vel * 0.26,
          level: LOW * n.vel,
          pan: LOW_PAN,
          when,
        });
      } else if (n.tremolo) {
        tremolo(out, {
          frequency,
          length,
          level: LEAD * n.vel,
          vel: n.vel,
          when,
          slide: false,
          tail: 0.8,
          thin: 0.55,
        });
      } else {
        guitar(context, out, {
          frequency,
          decay: length + 0.5,
          attack: 0.3 + n.vel * 0.45,
          level: LEAD * n.vel,
          pan: LEAD_PAN,
          when,
        });
      }
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
      /* §21: the landing's music has to be gone before the visitor settles
         anywhere else. A drone holds for twenty seconds and a score's strings
         for bars at a time, so silence has to actually take them away rather
         than just stop scheduling more. */
      if (next === "silence") {
        hushDrones();
        hushScore();
      }
    },
    resolve() {
      if (state === "silence" || resolving) return;
      resolving = true;
      const at = context.currentTime + 0.12;
      if (cue.score) {
        /*
          The score has up to two seconds of its next bar already queued, and
          a cadence played over the first notes of a phrase is not a cadence.
          So the queue goes quickly — in under half a second — and the
          closing plays into a fresh take. The strings are let go over the
          length of the closing instead, so it lands on a chord that is
          leaving rather than on nothing.
        */
        const score = cue.score;
        const over =
          Math.max(...score.closing.map((n) => n.beat + n.dur)) * (60 / score.bpm);
        hushScore(0.4, over);
        playClosing(score, at);
      } else {
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
      }
      state = "silence";
    },

    setCue(next) {
      if (next === cue) return;
      cue = next;
      index = 0;
      /* The old cue's bed is in the old cue's tuning, and a score's strings
         and queued bar are its own. Let them go rather than crossfade two
         pieces of music into each other; a score switched to begins again
         from wherever the state says it should. */
      hushDrones(1.2);
      hushScore(1.2);
      cursor = Math.max(cursor, context.currentTime + 0.4);
      droneCursor = Math.max(droneCursor, context.currentTime + 0.4);
    },

    stop() {
      window.clearInterval(timer);
      state = "silence";
      resolving = false;
      hushDrones(0.9);
      hushScore(0.9);
    },
  };
}
