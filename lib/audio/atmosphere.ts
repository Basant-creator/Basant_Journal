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
  /** The fire, when there is one. Null everywhere but Camp. */
  ember: {
    source: AudioBufferSourceNode;
    filter: BiquadFilterNode;
    gain: GainNode;
  } | null;
}

let rig: Rig | null = null;

/**
 * Whether the listener is standing at the fire.
 *
 * The wind belongs to the territory and plays wherever the atmosphere is on.
 * The fire belongs to one location, and mixing it into the bed meant a
 * campfire crackling over the professional résumé and the record office —
 * which is not atmosphere, it is a sound effect that escaped its scene.
 *
 * Kept outside the rig because it outlives it: it is a fact about where the
 * visitor is, true whether or not anything is currently making noise, so
 * switching the air on at Camp starts with the fire already lit.
 */
let nearFire = false;

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

  rig = { context, master, running, ember: null };
  if (nearFire) lightFire(rig);
  return true;
}

/**
 * The fire, as a loop of sporadic ember pops.
 *
 * The first version of this wrote a single full-scale sample every ~2200
 * samples, which at 48 kHz is twenty-one of them a second: not a fire, a
 * Geiger counter. And a one-sample impulse has no body — it is a click, and
 * the ear hears a fault rather than an ember.
 *
 * This places a countable number of pops per loop, each a short exponential
 * burst a few milliseconds long, and leaves the space between them silent.
 * The wind bed is already supplying air; a second noise floor underneath it
 * only ever added hiss.
 */
const EMBER_SECONDS = 6;
/** Pops per loop. Twelve over six seconds is a fire settling, not roaring. */
const EMBER_POPS = 12;

function emberBed(context: AudioContext): AudioBuffer {
  const length = Math.floor(context.sampleRate * EMBER_SECONDS);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let n = 0; n < EMBER_POPS; n += 1) {
    /* Placed at random rather than on a grid: a fire has no tempo, and a
       regular one is the tell that a loop is a loop. The tail is kept inside
       the buffer so no pop is cut in half at the seam. */
    const decay = 0.004 + Math.random() * 0.01;
    const body = Math.floor(context.sampleRate * decay * 6);
    const at = Math.floor(Math.random() * (length - body));
    const level = 0.35 + Math.random() * 0.5;

    for (let i = 0; i < body; i += 1) {
      const t = i / context.sampleRate;
      data[at + i] +=
        (Math.random() * 2 - 1) * level * Math.exp(-t / decay);
    }
  }

  return buffer;
}

/** Starts the fire on a running rig, fading it in so it never simply appears. */
function lightFire(target: Rig): void {
  if (target.ember) return;
  const { context, master } = target;

  const source = context.createBufferSource();
  source.buffer = emberBed(context);
  source.loop = true;

  /* Bandpass rather than highpass: embers are woody, and everything above a
     few kHz is the part that reads as static. */
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1900;
  filter.Q.value = 0.7;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, context.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, context.currentTime + FADE);

  source.connect(filter).connect(gain).connect(master);
  source.start();

  target.ember = { source, filter, gain };
}

/** Puts it out, and disconnects once the fade has actually finished. */
function douseFire(target: Rig): void {
  const ember = target.ember;
  if (!ember) return;
  target.ember = null;

  const { context } = target;
  try {
    ember.gain.gain.cancelScheduledValues(context.currentTime);
    ember.gain.gain.setValueAtTime(ember.gain.gain.value, context.currentTime);
    ember.gain.gain.linearRampToValueAtTime(0, context.currentTime + FADE);
  } catch {
    // A context already closing cannot be scheduled against.
  }

  window.setTimeout(() => {
    try {
      ember.source.stop();
    } catch {
      // Already stopped.
    }
    ember.source.disconnect();
    ember.filter.disconnect();
    ember.gain.disconnect();
  }, FADE * 1000 + 60);
}

/**
 * Declares whether the listener is at the fire.
 *
 * Called by the place, not by the control: Camp mounts and says there is a
 * fire here, unmounts and says there is not. Safe to call when nothing is
 * playing — it records the fact and the next start() honours it.
 */
export function setNearFire(on: boolean): void {
  if (nearFire === on) return;
  nearFire = on;
  if (!rig) return;
  if (on) lightFire(rig);
  else douseFire(rig);
}

/** Fades out, then tears the whole rig down. */
export function stop(): void {
  if (!rig) return;
  douseFire(rig);
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

/**
 * Synthesises a brief, quiet paper rustle when a document turns or an artifact opens.
 * No-op if atmosphere is not actively running.
 */
export function triggerPaperRustle(): void {
  if (!rig) return;
  const { context, master } = rig;
  try {
    const duration = 0.16;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.04));
    }
    const source = context.createBufferSource();
    source.buffer = buffer;

    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 1.2;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.04, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);

    source.connect(filter).connect(gain).connect(master);
    /* Rule 3 applies to the one-shots too. A finished source is eligible for
       collection on its own, but "eligible" is the engine's business and this
       file's promise is that nothing is left connected — a promise that costs
       one line here and is worth more than the argument about whether it is
       strictly required. */
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    source.start();
  } catch {
    // Silent fallback
  }
}

/**
 * Restrained mechanical tick for surveyor instruments and markers.
 * No-op if atmosphere is not actively running.
 */
export function triggerSurveyTick(): void {
  if (!rig) return;
  const { context, master } = rig;
  try {
    const osc = context.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, context.currentTime + 0.022);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.025, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.022);

    osc.connect(gain).connect(master);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start();
    osc.stop(context.currentTime + 0.025);
  } catch {
    // Silent fallback
  }
}
