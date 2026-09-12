/**
 * The air, generated rather than recorded.
 *
 * This site draws its ridges, its torn edges and its dust from seeds. Its
 * wind is the same idea in another medium: filtered noise shaped into gusts,
 * synthesised in the browser. Nothing is downloaded, nothing is licensed, and
 * the whole atmosphere costs zero bytes over the network.
 *
 * Three rules govern everything here:
 *
 *   1. **Nothing sounds until someone asks for it.** The AudioContext is not
 *      constructed until a click, which is both the browser's rule and the
 *      right one. A portfolio that makes noise at a stranger is a portfolio
 *      being closed.
 *   2. **It is never restored.** The preference is deliberately not
 *      remembered: a remembered "on" resumes on some later unrelated click,
 *      which is a surprise to anyone who has since opened the site in a
 *      library or a meeting. Re-asking costs one click; the alternative costs
 *      someone their afternoon.
 *   3. **It owns its own teardown.** Every node is disconnected and the
 *      context closed on stop, so leaving the page leaves nothing running.
 */

/** Quiet enough to be weather rather than content. */
const GAIN = 0.085;

/** Long enough that starting and stopping are never abrupt. */
const FADE = 1.1;

/** Seconds of noise generated and looped. Longer costs memory for nothing. */
const BED = 4;

interface Rig {
  context: AudioContext;
  master: GainNode;
  running: AudioScheduledSourceNode[];
}

let rig: Rig | null = null;

/**
 * Brown noise: white noise integrated.
 *
 * The spectrum falls at 6 dB per octave, which is the difference between
 * something that reads as wind and something that reads as a broken radio.
 * White noise through the same filter still sounds like static.
 */
function noiseBed(context: AudioContext): AudioBuffer {
  const length = Math.floor(context.sampleRate * BED);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.021 * white) / 1.021;
    data[i] = last * 3.2;
  }

  /* The loop point is the one place a generated bed can betray itself. Cross
     fading the tail over the head means the seam lands on a sample that was
     already heading there. */
  const seam = Math.floor(context.sampleRate * 0.25);
  for (let i = 0; i < seam; i += 1) {
    const t = i / seam;
    data[i] = data[i] * t + data[length - seam + i] * (1 - t);
  }

  return buffer;
}

/** One moving band of air: a filtered loop with its own slow gusting. */
function layer(
  context: AudioContext,
  bed: AudioBuffer,
  master: GainNode,
  { cutoff, q, level, gust, depth, offset }: {
    cutoff: number;
    q: number;
    level: number;
    gust: number;
    depth: number;
    offset: number;
  },
): AudioScheduledSourceNode[] {
  const source = context.createBufferSource();
  source.buffer = bed;
  source.loop = true;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  filter.Q.value = q;

  const gain = context.createGain();
  gain.gain.value = level;

  /* The gust. Without it the bed is a hiss that never goes anywhere; with it
     the air has weight and the ear stops hearing a loop. Deliberately slower
     than anyone would consciously track. */
  const lfo = context.createOscillator();
  lfo.frequency.value = gust;
  const lfoGain = context.createGain();
  lfoGain.gain.value = depth;
  lfo.connect(lfoGain).connect(filter.frequency);

  source.connect(filter).connect(gain).connect(master);

  source.start(context.currentTime + offset);
  lfo.start(context.currentTime + offset);

  return [source, lfo];
}

/** True once audio exists and is audible. */
export function isRunning(): boolean {
  return rig !== null;
}

/**
 * Builds the rig and fades it up. Must be called from a user gesture.
 * Returns false if the browser has no Web Audio at all.
 */
export function start(): boolean {
  if (rig) return true;

  const Ctor =
    typeof window !== "undefined"
      ? window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      : undefined;
  if (!Ctor) return false;

  let context: AudioContext;
  try {
    context = new Ctor();
  } catch {
    return false;
  }

  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  const bed = noiseBed(context);
  const running = [
    /* Far: the body of the wind, mostly felt. */
    ...layer(context, bed, master, {
      cutoff: 380,
      q: 0.6,
      level: 1,
      gust: 0.045,
      depth: 170,
      offset: 0,
    }),
    /* Near: thinner, quicker, the air actually passing you. Offset so the two
       loops never line up and give the bed a period. */
    ...layer(context, bed, master, {
      cutoff: 1100,
      q: 0.9,
      level: 0.28,
      gust: 0.072,
      depth: 420,
      offset: 1.3,
    }),
  ];

  master.gain.setValueAtTime(0, context.currentTime);
  master.gain.linearRampToValueAtTime(GAIN, context.currentTime + FADE);

  /* Resume is required where a context is created suspended. It is inside the
     gesture that called this, so it is allowed. */
  void context.resume().catch(() => {});

  rig = { context, master, running };
  return true;
}

/** Fades out, then tears the whole rig down. */
export function stop(): void {
  if (!rig) return;
  const { context, master, running } = rig;
  rig = null;

  const end = context.currentTime + FADE;
  try {
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(master.gain.value, context.currentTime);
    master.gain.linearRampToValueAtTime(0, end);
  } catch {
    // A context already closing cannot be scheduled against. Nothing to do.
  }

  window.setTimeout(
    () => {
      for (const node of running) {
        try {
          node.stop();
        } catch {
          // Already stopped.
        }
        node.disconnect();
      }
      master.disconnect();
      void context.close().catch(() => {});
    },
    FADE * 1000 + 60,
  );
}
