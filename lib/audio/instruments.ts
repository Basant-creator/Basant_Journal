/**
 * The instruments, synthesised.
 *
 * Nothing here is a recording. §40 refuses to ship an audio file whose licence
 * is unclear, §42 authorises original material where a licensed track does not
 * exist, and this repository's audio has been generated rather than recorded
 * from the beginning — the wind is filtered noise, the fire is a bed of
 * exponential pops. The banjo and the whistle join them on the same terms:
 * original, zero bytes over the network, and no licence to establish.
 *
 * Three voices and a percussive one, each the cheapest model that actually
 * sounds like the thing rather than like a synthesiser imitating it.
 */

/* -------------------------------------------------------------------------
   THE BANJO — Karplus-Strong

   A plucked string is a burst of noise trapped in a loop that is exactly one
   wavelength long, losing a little of its high end on each pass. That is the
   whole algorithm, it is fifty years old, and it produces a genuinely
   convincing pluck because it is a physical model rather than an imitation:
   the noise burst is the pick, the loop is the string, and the losses are the
   bridge and the air.

   A banjo rather than a guitar comes from three things — a very short, bright
   burst, little damping so it rings, and a head resonance around 300-400 Hz
   that the bandpass below stands in for.
   ------------------------------------------------------------------------- */

export interface PluckOptions {
  /** Hz. */
  frequency: number;
  /** Seconds the string rings for. */
  decay: number;
  /** 0..1 — how hard it was picked. Brightness as well as level. */
  attack: number;
}

/**
 * One plucked note, rendered into a buffer.
 *
 * Rendered rather than played through nodes because the loop has to run at
 * sample rate: a delay line short enough to sound a note is a few hundred
 * samples, and no arrangement of AudioNodes gives that cheaply or
 * deterministically.
 */
export function pluckBuffer(
  context: AudioContext,
  { frequency, decay, attack }: PluckOptions,
): AudioBuffer {
  const rate = context.sampleRate;
  const length = Math.floor(rate * decay);
  const buffer = context.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);

  /* The string: one wavelength of samples. */
  const period = Math.max(2, Math.round(rate / frequency));
  const line = new Float32Array(period);

  /* The pick. Brighter when struck harder, which is true of a real string and
     is most of what makes a soft phrase sound soft rather than just quiet. */
  const brightness = 0.35 + attack * 0.65;
  for (let i = 0; i < period; i += 1) {
    const noise = Math.random() * 2 - 1;
    /* A gentle window so the burst starts and ends at zero — without it the
       first period carries a click that reads as a fault, not a pick. */
    const window = Math.sin((Math.PI * i) / period);
    line[i] = noise * window * brightness;
  }

  /*
    The loop, with a one-pole lowpass in it.

    `damping` is how much of each sample survives to the next pass. Higher
    rings longer and brighter; a banjo sits high, around 0.5, where a nylon
    string would be nearer 0.3.
  */
  const damping = 0.5;
  let previous = 0;
  let index = 0;

  for (let i = 0; i < length; i += 1) {
    const current = line[index];
    /* Average with the previous sample: the filter, and the reason the tone
       darkens as it decays exactly as a real string does. */
    const filtered = (current + previous) * damping;
    previous = current;
    line[index] = filtered;
    out[i] = current;
    index = (index + 1) % period;
  }

  /* An overall envelope on top, so the note ends rather than being cut. */
  const release = Math.floor(rate * 0.05);
  for (let i = length - release; i < length; i += 1) {
    out[i] *= (length - i) / release;
  }

  return buffer;
}

/**
 * Plays one pluck through the given destination, panned.
 *
 * `slideFrom` is the ornament that does more for the idiom than any amount of
 * reverb: a note that starts a tone or a semitone flat and is pulled up into
 * place. It is a finger moving along a string after the pick has hit, and it
 * is the gesture that separates western playing from a scale being typed in.
 *
 * Cheap, too. The buffer was rendered at one pitch, so bending it is a ramp on
 * `playbackRate` - the string is genuinely re-tuned while it rings, exactly as
 * a real one is, rather than being crossfaded between two samples.
 */
export function pluck(
  context: AudioContext,
  destination: AudioNode,
  options: PluckOptions & {
    pan?: number;
    level?: number;
    when?: number;
    /** Ratio to start from: 0.944 is a semitone below, 0.891 a whole tone. */
    slideFrom?: number;
  },
): void {
  const source = context.createBufferSource();
  source.buffer = pluckBuffer(context, options);

  if (options.slideFrom !== undefined) {
    const at = options.when ?? context.currentTime;
    source.playbackRate.setValueAtTime(options.slideFrom, at);
    source.playbackRate.exponentialRampToValueAtTime(1, at + 0.13);
  }

  /*
    The head: a banjo's resonance, standing in for the drum it is built on.

    Peaking, not bandpass, and the difference is not subtle. A bandpass in
    series is a hole punched in the spectrum — everything away from 380 Hz is
    thrown away, including most of the fundamental of every note above A3 and
    all of the brightness that makes a banjo a banjo. It cost about 5.6x of
    level, which meant `level` did not describe anything: notes asked for at
    0.4 arrived at 0.035, below the wind.

    A drum head does not remove the string. It resonates *with* it, lifting a
    band and passing the rest. A peaking filter is that, it leaves the note's
    amplitude alone, and it happens to sound more like the instrument.
  */
  const body = context.createBiquadFilter();
  body.type = "peaking";
  body.frequency.value = 380;
  body.Q.value = 0.9;
  body.gain.value = 5;

  const gain = context.createGain();
  gain.gain.value = options.level ?? 0.5;

  const panner = context.createStereoPanner();
  panner.pan.value = options.pan ?? 0;

  source.connect(body).connect(gain).connect(panner).connect(destination);

  source.onended = () => {
    source.disconnect();
    body.disconnect();
    gain.disconnect();
    panner.disconnect();
  };

  source.start(options.when ?? context.currentTime);
}

/* -------------------------------------------------------------------------
   THE WHISTLE - a person, not an instrument

   S9: the banjo is the landscape's rhythm and the whistle is the human in it.
   The first version missed on three counts, and each one is the difference
   between a person and a patch.

   **It was a triangle wave.** A triangle carries strong odd harmonics, which
   is a flute, or a cheap synth lead. A human whistle is a Helmholtz resonator
   - the mouth cavity is the volume, the lips are the neck - and a resonator
   sings at almost exactly one frequency. It is very nearly a pure sine with a
   whisper of second harmonic and nothing above it.

   **Every note was its own oscillator.** So a phrase re-attacked on each note,
   which is an arpeggiator. A person cannot restart a whistle between notes any
   more than they can restart a vowel: the pitch *slides*, the tone never
   stops, and that continuous glide is most of what the ear uses to decide a
   human is doing it. The whole phrase is now one oscillator with a contour.

   **It sat in the banjo's octave.** Below about 600 Hz it competed with the
   instrument it is meant to answer, and lost. People whistle high - this now
   runs where whistling actually lives, above everything else in the mix, which
   is both more truthful and the reason it can be picked out at all.

   Everything else here is imperfection, deliberately: the pitch is a little
   off concert, the vibrato is two rates that never line up, there is breath
   under the whole note rather than in front of it, and the phrase sags at the
   end because the player is running out of air.
   ------------------------------------------------------------------------- */

export interface WhistleNote {
  /** Seconds from the phrase's start. */
  at: number;
  /** Hz. */
  note: number;
  /** Seconds this note is held. */
  hold: number;
}

export interface WhistleOptions {
  notes: WhistleNote[];
  level?: number;
  pan?: number;
  when?: number;
}

export function whistle(
  context: AudioContext,
  destination: AudioNode,
  { notes, level = 0.3, pan = 0, when }: WhistleOptions,
): void {
  if (notes.length === 0) return;

  const t = when ?? context.currentTime;
  const tail = notes[notes.length - 1];
  const duration = tail.at + tail.hold;
  const mean = notes.reduce((sum, n) => sum + n.note, 0) / notes.length;

  /* Nobody whistles at concert pitch. Up to a quarter tone out, per phrase. */
  const offset = (Math.random() - 0.5) * 50;

  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(destination);

  const gain = context.createGain();
  gain.connect(panner);

  const osc = context.createOscillator();
  osc.type = "sine";
  osc.detune.value = offset;

  /* The one harmonic a real whistle has, and it is faint. Any more and it
     stops being a whistle and becomes a recorder. */
  const harmonic = context.createOscillator();
  harmonic.type = "sine";
  harmonic.detune.value = offset;
  const harmonicGain = context.createGain();
  harmonicGain.gain.value = 0.07;

  osc.connect(gain);
  harmonic.connect(harmonicGain).connect(gain);

  /*
    The pitch contour - one continuous line through the whole phrase.

    Each note is *arrived at* rather than started: the slide begins 70 ms early
    and completes just after the beat, which is what a whistled interval
    actually does. The first note is scooped into from below, because nobody
    hits a pitch dead centre out of silence.
  */
  const contour = (param: AudioParam, multiple: number) => {
    param.setValueAtTime(notes[0].note * 0.94 * multiple, t);
    param.exponentialRampToValueAtTime(notes[0].note * multiple, t + 0.1);
    for (let i = 1; i < notes.length; i += 1) {
      param.setValueAtTime(notes[i - 1].note * multiple, t + notes[i].at - 0.07);
      param.exponentialRampToValueAtTime(
        notes[i].note * multiple,
        t + notes[i].at + 0.03,
      );
    }
    /* Running out of air: the last note sags rather than holding. */
    param.exponentialRampToValueAtTime(tail.note * 0.975 * multiple, t + duration);
  };
  contour(osc.frequency, 1);
  contour(harmonic.frequency, 2);

  /*
    Vibrato at two rates that never line up.

    A single LFO is a machine - the ear locks onto the period within a second.
    4.9 and 6.7 Hz are incommensurate, so the combined wobble never repeats,
    and a slow third one underneath keeps the centre pitch drifting. All of it
    arrives *after* the attack, because a held note wavers and an attack does
    not, and starting them together is the tell of a synthesised whistle.
  */
  const wobble = context.createGain();
  wobble.gain.setValueAtTime(0, t);
  wobble.gain.linearRampToValueAtTime(20, t + Math.min(0.6, duration * 0.4));
  wobble.connect(osc.detune);
  wobble.connect(harmonic.detune);

  const vibratos: OscillatorNode[] = [];
  for (const rate of [4.9, 6.7]) {
    const lfo = context.createOscillator();
    lfo.frequency.value = rate;
    const depth = context.createGain();
    depth.gain.value = rate === 4.9 ? 1 : 0.55;
    lfo.connect(depth).connect(wobble);
    lfo.start(t);
    lfo.stop(t + duration + 0.1);
    vibratos.push(lfo);
  }

  const drift = context.createOscillator();
  drift.frequency.value = 0.6;
  const driftDepth = context.createGain();
  driftDepth.gain.value = 9;
  drift.connect(driftDepth);
  driftDepth.connect(osc.detune);
  driftDepth.connect(harmonic.detune);
  drift.start(t);
  drift.stop(t + duration + 0.1);

  /*
    Loudness, and the small dip at each note boundary.

    The tone never stops, but a person does re-articulate - a push of breath on
    each new note. Without the dip the phrase is one long smear and the
    individual notes stop being audible as notes.
  */
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + 0.14);
  for (let i = 1; i < notes.length; i += 1) {
    const at = t + notes[i].at;
    gain.gain.setValueAtTime(level * 0.66, at - 0.05);
    gain.gain.linearRampToValueAtTime(level, at + 0.08);
  }
  gain.gain.setValueAtTime(level, t + duration - 0.32);
  gain.gain.linearRampToValueAtTime(0, t + duration);

  /*
    Breath, under the whole phrase rather than in front of it.

    The original put a 120 ms puff at the start, which reads as a consonant.
    Real whistling leaks air continuously, and it is that noise floor riding
    along with the tone that makes the ear place a mouth behind the sound.
  */
  const breath = context.createBufferSource();
  const breathLength = Math.max(1, Math.floor(context.sampleRate * duration));
  const breathBuffer = context.createBuffer(1, breathLength, context.sampleRate);
  const data = breathBuffer.getChannelData(0);
  for (let i = 0; i < breathLength; i += 1) data[i] = Math.random() * 2 - 1;
  breath.buffer = breathBuffer;

  const breathBand = context.createBiquadFilter();
  breathBand.type = "bandpass";
  breathBand.frequency.value = mean * 1.4;
  breathBand.Q.value = 0.9;

  const breathGain = context.createGain();
  breathGain.gain.setValueAtTime(0, t);
  /* Loudest at the attack - the first push of air - then settling. */
  breathGain.gain.linearRampToValueAtTime(level * 0.3, t + 0.1);
  breathGain.gain.linearRampToValueAtTime(level * 0.13, t + 0.5);
  breathGain.gain.setValueAtTime(level * 0.13, t + duration - 0.32);
  breathGain.gain.linearRampToValueAtTime(0, t + duration);

  breath.connect(breathBand).connect(breathGain).connect(panner);

  osc.start(t);
  osc.stop(t + duration + 0.05);
  harmonic.start(t);
  harmonic.stop(t + duration + 0.05);
  breath.start(t);
  breath.stop(t + duration + 0.05);

  osc.onended = () => {
    osc.disconnect();
    harmonic.disconnect();
    harmonicGain.disconnect();
    for (const lfo of vibratos) lfo.disconnect();
    drift.disconnect();
    driftDepth.disconnect();
    wobble.disconnect();
    gain.disconnect();
    breath.disconnect();
    breathBand.disconnect();
    breathGain.disconnect();
    panner.disconnect();
  };
}

/* -------------------------------------------------------------------------
   HOOVES

   A hoof on dry ground is a short noise burst with a fast pitch drop — the
   impact, then the ground absorbing it. Two of them close together is a
   walking horse; four in the gallop's uneven rhythm is a running one.
   ------------------------------------------------------------------------- */

export function hoof(
  context: AudioContext,
  destination: AudioNode,
  { level = 0.4, pan = 0, when, distance = 0 }: { level?: number; pan?: number; when?: number; distance?: number },
): void {
  const t = when ?? context.currentTime;

  const source = context.createBufferSource();
  const length = Math.floor(context.sampleRate * 0.09);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    /* Sharp attack, quick decay: the strike and the dust. */
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (context.sampleRate * 0.012));
  }
  source.buffer = buffer;

  /*
    Distance, as filtering rather than only as level (§12, §14).

    Air eats high frequencies before it eats loudness, so a far hoofbeat is
    duller as well as quieter. Turning only the volume down leaves a close,
    bright sound played softly — which the ear reads as "small", not "far".
  */
  const body = context.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 2400 - distance * 1700;
  body.Q.value = 0.8;

  const thump = context.createBiquadFilter();
  thump.type = "peaking";
  thump.frequency.value = 130;
  thump.gain.value = 8 - distance * 5;
  thump.Q.value = 1.1;

  const gain = context.createGain();
  gain.gain.value = level * (1 - distance * 0.72);

  const panner = context.createStereoPanner();
  panner.pan.value = pan;

  source.connect(body).connect(thump).connect(gain).connect(panner).connect(destination);
  source.onended = () => {
    source.disconnect();
    body.disconnect();
    thump.disconnect();
    gain.disconnect();
    panner.disconnect();
  };
  source.start(t);
}

/* -------------------------------------------------------------------------
   BIRDS

   §17 asks for sparse wildlife and §18 for silence around it. A chirp is a
   short frequency sweep with a couple of repeats; what keeps it from becoming
   a jungle is the gaps, which live in the scheduler rather than here.
   ------------------------------------------------------------------------- */

export function chirp(
  context: AudioContext,
  destination: AudioNode,
  { level = 0.2, pan = 0, when }: { level?: number; pan?: number; when?: number },
): void {
  const t = when ?? context.currentTime;
  const notes = 2 + Math.floor(Math.random() * 3);
  const base = 2200 + Math.random() * 1600;

  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(destination);

  for (let n = 0; n < notes; n += 1) {
    const at = t + n * (0.07 + Math.random() * 0.05);
    const osc = context.createOscillator();
    osc.type = "sine";
    const up = Math.random() > 0.5;
    const f = base * (0.9 + Math.random() * 0.25);
    osc.frequency.setValueAtTime(up ? f * 0.82 : f, at);
    osc.frequency.exponentialRampToValueAtTime(up ? f : f * 0.84, at + 0.05);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);

    osc.connect(gain).connect(panner);
    osc.start(at);
    osc.stop(at + 0.08);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  /* The panner outlives its notes by a moment, then goes. */
  window.setTimeout(() => panner.disconnect(), (notes * 0.13 + 0.4) * 1000);
}

/* -------------------------------------------------------------------------
   THE BOW — what holds the whole thing up

   The gap between a synthesised motif and a scored one is almost never the
   tune. It is that a plucked note starts, decays and leaves nothing behind, so
   the music arrives as a sequence of events rather than as a thing that is
   already happening and that the banjo is playing over.

   A bowed string is a sawtooth, and not by analogy: the Helmholtz motion of a
   real bowed string is a travelling kink that makes the bridge force a near
   perfect sawtooth. So three of them, detuned by a few cents, is most of a
   string section — the detuning is what turns one instrument into several
   players who cannot possibly agree.

   Returned rather than fired and forgotten, because a drone that outlives the
   route it belongs to is worse than no drone: the landing's music has to be
   gone before the visitor settles anywhere else, and this one can ring for
   twenty seconds.
   ------------------------------------------------------------------------- */

export interface Sustained {
  /** Fades the note out early and frees it. */
  release(seconds?: number): void;
}

export interface BowOptions {
  frequency: number;
  /** Seconds, including the attack and the release. */
  duration: number;
  level?: number;
  pan?: number;
  when?: number;
}

export function bow(
  context: AudioContext,
  destination: AudioNode,
  { frequency, duration, level = 0.15, pan = 0, when }: BowOptions,
): Sustained {
  const t = when ?? context.currentTime;

  /* Slow both ends. A drone that arrives is an event; a drone that was
     already there is a place. */
  const attack = Math.min(2.4, duration * 0.3);
  const release = Math.min(3.2, duration * 0.35);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + attack);
  gain.gain.setValueAtTime(level, t + duration - release);
  gain.gain.linearRampToValueAtTime(0, t + duration);

  /*
    Bow pressure, as a filter that opens and closes.

    A sawtooth held at a fixed cutoff is an organ. What makes it read as a bow
    is that the brightness moves independently of the loudness — the player
    leans in as the note settles and eases off at the end.
  */
  const tone = context.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.setValueAtTime(frequency * 3, t);
  tone.frequency.linearRampToValueAtTime(frequency * 7, t + attack);
  tone.frequency.linearRampToValueAtTime(frequency * 3.5, t + duration);
  tone.Q.value = 0.6;

  const panner = context.createStereoPanner();
  panner.pan.value = pan;

  tone.connect(gain).connect(panner).connect(destination);

  const voices: OscillatorNode[] = [];
  for (const cents of [-7, 0, 6]) {
    const osc = context.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = frequency;
    osc.detune.value = cents;
    osc.connect(tone);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    voices.push(osc);
  }

  /* A very slow drift across all three at once, arriving after the attack.
     Held strings wander; strings that do not are a sample being looped. */
  const drift = context.createOscillator();
  drift.type = "sine";
  drift.frequency.value = 0.13;
  const driftDepth = context.createGain();
  driftDepth.gain.setValueAtTime(0, t);
  driftDepth.gain.linearRampToValueAtTime(4, t + attack);
  drift.connect(driftDepth);
  for (const osc of voices) driftDepth.connect(osc.detune);
  drift.start(t);
  drift.stop(t + duration + 0.05);

  voices[0].onended = () => {
    for (const osc of voices) osc.disconnect();
    drift.disconnect();
    driftDepth.disconnect();
    tone.disconnect();
    gain.disconnect();
    panner.disconnect();
  };

  return {
    release(seconds = 1.4) {
      const now = context.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + seconds);
        for (const osc of voices) osc.stop(now + seconds + 0.05);
        drift.stop(now + seconds + 0.05);
      } catch {
        /* Already stopped, or a context that is closing. */
      }
    },
  };
}
