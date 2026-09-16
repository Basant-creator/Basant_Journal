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
 * Tuned against each other rather than set from a table: what matters is that
 * a whistle phrase never competes with a page turn, and that wind is always
 * the quietest thing running.
 */
const LEVELS: Record<BusName, number> = {
  environment: 0.15,
  animals: 0.22,
  music: 0.3,
  interaction: 0.5,
  paper: 0.75,
};

export interface Desk {
  context: AudioContext;
  master: GainNode;
  bus: Record<BusName, GainNode>;
}

/** Wires a fresh desk. The caller owns the context's lifetime. */
export function createDesk(context: AudioContext): Desk {
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const bus = {} as Record<BusName, GainNode>;
  for (const name of Object.keys(LEVELS) as BusName[]) {
    const node = context.createGain();
    node.gain.value = LEVELS[name];
    node.connect(master);
    bus[name] = node;
  }

  return { context, master, bus };
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
