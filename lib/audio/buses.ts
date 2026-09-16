/**
 * The mixing desk.
 *
 * §32 and §34 both ask for one place that owns level, and the reason is the
 * one every growing audio system runs into: without a desk, every new sound
 * connects itself straight to the output, and "make the music quieter while a
 * page turns" becomes a change in six files that each know a different
 * fraction of the truth.
 *
 * So there is a tree, it is the only route to the speakers, and nothing
 * connects past it:
 *
 *   master
 *   ├── environment   wind, air, weather — the bed
 *   ├── animals       hooves, birds, insects
 *   ├── music         banjo and whistle
 *   ├── interaction   ticks and marks the interface makes
 *   └── paper         pages, covers, documents
 *
 * The levels below are §31's hierarchy, which is a starting point and was
 * tuned by ear from there. Two things it encodes that are easy to lose:
 * the environment sits *under* everything (§16 — the visitor should notice
 * its absence rather than its presence), and paper is loud, because inside
 * the field book the paper is the subject rather than the atmosphere.
 */

export type BusName =
  | "environment"
  | "animals"
  | "music"
  | "interaction"
  | "paper";

/**
 * Resting level per bus, as a fraction of master.
 *
 * Tuned against each other rather than set from a table. The second pass moved
 * two of them a long way on the owner's ear: **the wind down and the music up.**
 *
 * The first balance followed §31's hierarchy literally and put the weather
 * under everything, which is right for a place you are standing in and wrong
 * for a place you are being shown. A portfolio is the second thing. Wind at
 * 0.15 was a bed the banjo had to climb out of; at 0.08 it is air, and the
 * banjo and the whistle are what the visitor came for.
 *
 * The one rule that survives unchanged: the environment is the quietest thing
 * running, and its absence should be more noticeable than its presence.
 */
const LEVELS: Record<BusName, number> = {
  /* Halved. Weather, not a soundtrack of weather. */
  environment: 0.08,
  animals: 0.22,
  /* Banjo and whistle, now the loudest voices in the mix rather than a layer
     inside it. 0.3 -> 0.5. */
  music: 0.5,
  interaction: 0.5,
  paper: 0.75,
};

export interface Desk {
  context: AudioContext;
  master: GainNode;
  bus: Record<BusName, GainNode>;
  /** The safety limiter. The last node before the speakers. */
  limiter: DynamicsCompressorNode;
}

/** Wires a fresh desk. The caller owns the context's lifetime. */
export function createDesk(context: AudioContext): Desk {
  /*
    A limiter, and it earns its place now that the music is loud.

    A banjo phrase holds notes for up to two seconds, so four plucks can be
    ringing at once; at the new music level four aligned peaks come to roughly
    0.47 on their own, and the rest of the mix sits on top of that. Nothing
    guarantees they never align. Digital clipping is not a soft failure — it is
    a buzz, and one buzz is all it takes for the whole thing to sound cheap.

    Set as a limiter rather than as a compressor: high ratio, fast attack, and
    a threshold it only ever reaches on a stack. It is inaudible in normal
    playing and catches the one phrase in a hundred that would have clipped.
  */
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 3;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  limiter.connect(context.destination);

  const master = context.createGain();
  master.gain.value = 0;
  master.connect(limiter);

  const bus = {} as Record<BusName, GainNode>;
  for (const name of Object.keys(LEVELS) as BusName[]) {
    const node = context.createGain();
    node.gain.value = LEVELS[name];
    node.connect(master);
    bus[name] = node;
  }

  return { context, master, bus, limiter };
}

/**
 * Duck a bus and bring it back.
 *
 * §33: a page turning should be heard over the music, and the music should
 * return without anybody noticing it left. Down fast, back slow — the reverse
 * reads as a mistake, because a level that rises quickly sounds like a fault
 * and one that falls slowly sounds like a fade.
 *
 * Written as **one envelope** rather than two ramps, and that is the whole
 * subtlety. The obvious version schedules a ramp down now and a ramp up later,
 * each anchored with `setValueAtTime(param.value, at)` — but `param.value` is
 * read when the call is made, not when `at` arrives, so the second anchor pins
 * the gain to its *resting* level at the moment the fade was meant to begin.
 * The bus then steps back to full in a single block and fades from rest to
 * rest. Measured: down to 0.165 as intended, and back at 0.3 within 200 ms
 * instead of over 740 ms — the exact jump the paragraph above says to avoid.
 *
 * Re-entrant on purpose. Three page turns in a second should hold the duck
 * rather than fight over it, which is what cancelling and re-anchoring from
 * the *current* value achieves: the second duck starts from wherever the first
 * had reached, because `now` is a time the param has actually arrived at.
 */
export function duck(
  desk: Desk,
  name: BusName,
  amount = 0.55,
  holdSeconds = 0.18,
): void {
  const param = desk.bus[name].gain;
  const now = desk.context.currentTime;
  const rest = LEVELS[name];
  const floor = rest * amount;

  /* Fast down, hold, slow back. */
  const DOWN = 0.06;
  const UP = 0.5;

  try {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(floor, now + DOWN);
    param.setValueAtTime(floor, now + DOWN + holdSeconds);
    param.linearRampToValueAtTime(rest, now + DOWN + holdSeconds + UP);
  } catch {
    /* A context that is already closing cannot be scheduled against. */
  }
}
