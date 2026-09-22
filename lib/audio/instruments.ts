/**
 * The instruments, synthesised.
 *
 * Nothing here is a recording. §40 refuses to ship an audio file whose licence
 * is unclear, §42 authorises original material where a licensed track does not
 * exist, and this repository's audio has been generated rather than recorded
 * from the beginning — the wind is filtered noise, the fire is a bed of
 * exponential pops. The guitar and the whistle join them on the same terms:
 * original, zero bytes over the network, and no licence to establish.
 *
 * Three voices and a percussive one, each the cheapest model that actually
 * sounds like the thing rather than like a synthesiser imitating it.
 */

/* -------------------------------------------------------------------------
   THE STRING - Karplus-Strong

   A plucked string is a burst of noise trapped in a loop that is exactly one
   wavelength long, losing a little of its high end on each pass. That is the
   whole algorithm, it is fifty years old, and it produces a genuinely
   convincing pluck because it is a physical model rather than an imitation:
   the noise burst is the pick, the loop is the string, and the losses are the
   bridge and the air.

   Note that this is the *string* and not an instrument. A string on its own
   sounds like almost nothing in particular; what decides whether you are
   hearing a guitar, a banjo or a harp is the body it is coupled to. So this
   returns a bare buffer and `guitar()` below supplies the body.
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
    rings longer and brighter. This stays at 0.5, the lossless two-point
    average, so the string itself sustains like gut; the darkness that makes it
    a nylon guitar rather than a bright one comes from the body below and from
    how softly it is picked, not from strangling the string here.
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

/* -------------------------------------------------------------------------
   THE GUITAR

   The body, which is where the instrument actually lives. The string above is
   the same delay line whatever you build around it; a guitar is what you get
   when the resonator is a *box of air*, and a box resonates low - the
   Helmholtz mode of a guitar body sits near 110 Hz, the top plate near 215,
   and the wood absorbs most of what is above three kilohertz.

   (For contrast, and because this used to be one: a banjo's resonator is a
   drum, a tensioned membrane with a sharp mid resonance around 380 Hz. Same
   string, one filter chain apart, and they sound nothing alike. That is the
   whole reason this file models bodies rather than instruments.)

   Nylon rather than steel. The brief asked for banjo and the owner asked for
   guitar instead, and a dark gut-string is the right reading of that: the
   palette already has a bright voice in the whistle, and the point of moving
   off the banjo was to stop the lead cutting so hard.
   ------------------------------------------------------------------------- */

export function guitar(
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

  /*
    The slide, and on a guitar it is the signature rather than an ornament: a
    note that starts a tone or a semitone flat and is pulled up into place by a
    finger moving along the string after the pick has hit.

    A ramp on `playbackRate`, so the string is genuinely re-tuned while it
    rings, exactly as a real one is, rather than crossfaded between two
    samples.
  */
  if (options.slideFrom !== undefined) {
    const at = options.when ?? context.currentTime;
    source.playbackRate.setValueAtTime(options.slideFrom, at);
    source.playbackRate.exponentialRampToValueAtTime(1, at + 0.13);
  }

  /* The air inside the box. The lowest thing the instrument does, and the
     part a listener feels rather than hears. */
  const air = context.createBiquadFilter();
  air.type = "peaking";
  air.frequency.value = 110;
  /* Gentler and wider than when the guitar only answered in the gaps. The
     figures pedal on D3, whose 147 Hz fundamental sits on the shoulder of this
     peak - at +7 dB and Q 1.2 a repeated low string boomed. */
  air.Q.value = 1;
  air.gain.value = 5;

  /* The top plate: the wooden note under every note. */
  const plate = context.createBiquadFilter();
  plate.type = "peaking";
  plate.frequency.value = 215;
  plate.Q.value = 1.4;
  plate.gain.value = 4;

  /* Wood absorbs the top. Without this it is a harpsichord. */
  const warmth = context.createBiquadFilter();
  warmth.type = "lowpass";
  /* Opened from 2600: the instrument carries the tune now, and at 2600 the
     melody above the third string went muddy. */
  warmth.frequency.value = 3200;
  warmth.Q.value = 0.7;

  const gain = context.createGain();
  gain.gain.value = options.level ?? 0.28;

  const panner = context.createStereoPanner();
  panner.pan.value = options.pan ?? 0;

  source
    .connect(air)
    .connect(plate)
    .connect(warmth)
    .connect(gain)
    .connect(panner)
    .connect(destination);

  source.onended = () => {
    source.disconnect();
    air.disconnect();
    plate.disconnect();
    warmth.disconnect();
    gain.disconnect();
    panner.disconnect();
  };

  source.start(options.when ?? context.currentTime);
}

/* -------------------------------------------------------------------------
   THE WHISTLE - a person, not an instrument

   S9: the guitar is the landscape's rhythm and the whistle is the human in it.
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

   **It sat in the lead's octave.** Below about 600 Hz it competed with the
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
   BIRDS

   §17 asks for sparse wildlife and §18 for silence around it. A chirp is a
   short frequency sweep with a couple of repeats; what keeps it from becoming
   a jungle is the gaps, which live in the scheduler rather than here.
   ------------------------------------------------------------------------- */

/* =========================================================================
   THE RHYTHM SECTION

   Added because the inventory said there was not one. Everything in this file
   before now is something a person holds; these three are the room around
   them, and a cue that wants to sound warm rather than empty needs the room
   more than it needs another note.

   Written from the same primitives as the rest — noise, a sine, an envelope —
   so nothing here is a sample and the licence position is unchanged.
   ========================================================================= */

/**
 * A soft kick: a low sine falling fast under its own envelope.
 *
 * Not a drum kit kick. The pitch drops from 96 to 46 Hz in fifty
 * milliseconds, which is a thump with a body rather than a click with a tail,
 * and at the levels this cue uses it reads as something struck in another
 * room. There is no click transient on purpose: the attack is four
 * milliseconds of ramp, so the ear places it without the eye of the mix
 * turning toward it.
 */
export function thump(
  context: AudioContext,
  destination: AudioNode,
  { level = 0.2, pan = 0, when }: { level?: number; pan?: number; when?: number },
): void {
  const t = when ?? context.currentTime;

  const osc = context.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(96, t);
  osc.frequency.exponentialRampToValueAtTime(46, t + 0.05);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);

  const panner = context.createStereoPanner();
  panner.pan.value = pan;

  osc.connect(gain).connect(panner).connect(destination);
  osc.start(t);
  osc.stop(t + 0.32);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
    panner.disconnect();
  };
}

/**
 * A brush across a head: filtered noise, short, with no pitch in it.
 *
 * `tone` moves the bandpass between roughly 1.2 and 4 kHz — low for a stick
 * on a rim, high for a wire brush — and the decay is short enough that it
 * never becomes a cymbal. It is the backbeat, and in this cue it is quieter
 * than the wind.
 */
export function brush(
  context: AudioContext,
  destination: AudioNode,
  {
    level = 0.12,
    tone = 0.5,
    decay = 0.12,
    pan = 0,
    when,
  }: { level?: number; tone?: number; decay?: number; pan?: number; when?: number },
): void {
  const t = when ?? context.currentTime;

  /* A tenth of a second of noise, generated per hit. Short enough that the
     allocation is cheaper than keeping a pool alive, and different every
     time, which is the point of a brush. */
  const frames = Math.ceil(context.sampleRate * (decay + 0.05));
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = Math.random() * 2 - 1;

  const source = context.createBufferSource();
  source.buffer = buffer;

  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1200 + tone * 2800;
  band.Q.value = 0.8;

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);

  const panner = context.createStereoPanner();
  panner.pan.value = pan;

  source.connect(band).connect(gain).connect(panner).connect(destination);
  source.start(t);
  source.stop(t + decay + 0.05);
  source.onended = () => {
    source.disconnect();
    band.disconnect();
    gain.disconnect();
    panner.disconnect();
  };
}

/** A running tape bed. Stop it by calling the returned function. */
export interface Tape {
  stop(fade?: number): void;
}

/**
 * Hiss and crackle, continuously.
 *
 * This is the layer that was missing, and the reason the sparse cue read as
 * empty rather than as quiet. Silence in a recording is not silence: it is a
 * noise floor, and an ear that is given one stops hearing the gaps as
 * absences and starts hearing them as room. Sparse and empty are the same
 * notes with and without this underneath them.
 *
 * Two parts. A filtered hiss, rolled off hard so it sits behind everything
 * rather than on top of it, with a slow wobble on the filter so it breathes.
 * And crackle: short pops, scattered, which is what makes it read as tape
 * rather than as a broken output.
 *
 * Both are much quieter and duller than the first version, which was reported
 * as sounding like rain — and was. Broadband transients at a few per second
 * *are* rain; that is the whole acoustic description of it. The pops are now
 * roughly one every second and a half at a third of the amplitude, and the
 * hiss is rolled off at 3 kHz instead of 5.2 so it has no spray in it. A tape
 * floor is meant to be the thing you notice when it stops, and the previous
 * settings made it the thing you noticed while it ran.
 *
 * Eight seconds of buffer, looped. Long enough that the loop point is past
 * anybody counting and short enough not to be worth streaming.
 */
export function tape(
  context: AudioContext,
  destination: AudioNode,
  { level = 0.03, crackle = 0.7, when }: { level?: number; crackle?: number; when?: number },
): Tape {
  const t = when ?? context.currentTime;
  const seconds = 8;
  const frames = context.sampleRate * seconds;
  const buffer = context.createBuffer(2, frames, context.sampleRate);

  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel);
    /* A one-pole low-pass on white noise, which is cheaper than a filter node
       and gives the hiss its dullness at source. */
    let last = 0;
    for (let i = 0; i < frames; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.9 + white * 0.1;
      data[i] = last * 1.5;
    }
    /* Crackle, on top and much louder than the floor it sits in — a pop is
       brief enough that peak level and perceived level are different things. */
    const pops = Math.round(crackle * seconds);
    for (let n = 0; n < pops; n += 1) {
      const at = Math.floor(Math.random() * (frames - 64));
      const amp = 0.09 + Math.random() * 0.2;
      for (let i = 0; i < 28; i += 1) {
        data[at + i] += amp * Math.exp(-i / 4.5) * (Math.random() * 2 - 1);
      }
    }
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const shelf = context.createBiquadFilter();
  shelf.type = "lowpass";
  shelf.frequency.value = 3000;

  /* Wow and flutter, on the filter rather than on the pitch: moving the pitch
     of a noise bed does nothing audible, and moving its brightness is what a
     worn tape actually does to the top end. */
  const lfo = context.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoGain = context.createGain();
  lfoGain.gain.value = 480;
  lfo.connect(lfoGain).connect(shelf.frequency);

  const gain = context.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(level, t + 2.2);

  source.connect(shelf).connect(gain).connect(destination);
  source.start(t);
  lfo.start(t);

  return {
    stop(fade = 1.4) {
      const now = context.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + fade);
      source.stop(now + fade + 0.1);
      lfo.stop(now + fade + 0.1);
      source.onended = () => {
        source.disconnect();
        shelf.disconnect();
        gain.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
      };
    },
  };
}

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
   already happening and that the guitar is playing over.

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

/* -------------------------------------------------------------------------
   THE MOUTH ORGAN - a free reed

   The third way of making a note in this file, and deliberately not a variant
   of either of the other two. The guitar is a plucked string: energy goes in
   once and leaks out. The whistle is a resonator: a cavity singing at one
   frequency. A harmonica is neither - it is a strip of brass being pushed
   past a slot by moving air, opening and closing the gap as it goes.

   What that does to the sound is the part worth modelling. A free reed chops
   the airflow rather than swinging smoothly through it, so the spectrum is
   rich and *shallow*: a strong fundamental with a long tail of harmonics that
   fall away slowly, both odd and even, where a plucked string's die off fast
   and a whistle has almost none at all. That is why a harmonica cuts through
   a band at a fraction of the volume, and why it cannot be faked with a
   filtered sawtooth - a saw has the wrong ratio between the low harmonics.

   So the waveform is built from an explicit harmonic series through
   `createPeriodicWave`, which is exact, costs nothing at runtime, and is the
   one place in this file where naming the partials is simpler than modelling
   the physics.

   Two other things carry it. Reeds come in pairs that are never quite in
   tune, so two oscillators a few cents apart beat against each other - that
   slow waver is most of what says "harmonica" before a single note is over.
   And the player's hands open and close over the back of the instrument,
   which is a filter sweep and a tremolo at the same time.
   ------------------------------------------------------------------------- */

export interface ReedNote {
  /** Seconds from the phrase's start. */
  at: number;
  note: number;
  /** Seconds the note is held. */
  hold: number;
  /**
   * Semitones to bend up into the note from below.
   *
   * A draw bend is the harmonica's signature and nothing else in this palette
   * can do it: the reed is pulled flat by the player's throat and released.
   * Rare on purpose - on every note it is a novelty rather than an accent.
   */
  bend?: number;
}

export interface HarmonicaOptions {
  notes: ReedNote[];
  level?: number;
  pan?: number;
  when?: number;
}

/**
 * The reed's spectrum.
 *
 * Index 0 is DC and must be zero. After that: a strong fundamental, a second
 * partial close behind it, and a tail that thins slowly rather than falling
 * off a cliff. The imaginary terms stay zero — phase is inaudible here and
 * zeroing it keeps the wave symmetrical.
 *
 * Built once and shared: a PeriodicWave is immutable and can be handed to
 * every oscillator this instrument ever creates.
 */
const REED_PARTIALS = [
  0, 1, 0.62, 0.48, 0.34, 0.27, 0.19, 0.14, 0.1, 0.075, 0.055, 0.04,
];

let reedWave: PeriodicWave | null = null;
function reed(context: AudioContext): PeriodicWave {
  if (!reedWave) {
    reedWave = context.createPeriodicWave(
      new Float32Array(REED_PARTIALS),
      new Float32Array(REED_PARTIALS.length),
      { disableNormalization: false },
    );
  }
  return reedWave;
}

export function harmonica(
  context: AudioContext,
  destination: AudioNode,
  { notes, level = 0.26, pan = 0, when }: HarmonicaOptions,
): void {
  if (notes.length === 0) return;

  const t = when ?? context.currentTime;
  const tail = notes[notes.length - 1];
  const duration = tail.at + tail.hold;
  const wave = reed(context);

  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(destination);

  /* The hands. A slow sweep across the phrase rather than a fixed tone: open
     hands are bright and forward, closed hands are dark and behind. */
  const cup = context.createBiquadFilter();
  cup.type = "peaking";
  cup.frequency.value = 1500;
  cup.Q.value = 0.9;
  cup.gain.setValueAtTime(-3, t);
  cup.gain.linearRampToValueAtTime(5, t + duration * 0.45);
  cup.gain.linearRampToValueAtTime(-2, t + duration);

  /* Brass, not wire. Everything above this is reed buzz nobody wants. */
  const air = context.createBiquadFilter();
  air.type = "lowpass";
  air.frequency.value = 3600;
  air.Q.value = 0.7;

  cup.connect(air).connect(panner);

  /* Breath, under the whole phrase. A harmonica leaks air by design. */
  const breath = context.createBufferSource();
  const breathLength = Math.max(1, Math.floor(context.sampleRate * duration));
  const breathBuffer = context.createBuffer(1, breathLength, context.sampleRate);
  const data = breathBuffer.getChannelData(0);
  for (let i = 0; i < breathLength; i += 1) data[i] = Math.random() * 2 - 1;
  breath.buffer = breathBuffer;
  const breathBand = context.createBiquadFilter();
  breathBand.type = "bandpass";
  breathBand.frequency.value = 1100;
  breathBand.Q.value = 0.6;
  const breathGain = context.createGain();
  breathGain.gain.setValueAtTime(0, t);
  breathGain.gain.linearRampToValueAtTime(level * 0.16, t + 0.12);
  breathGain.gain.setValueAtTime(level * 0.16, t + duration - 0.3);
  breathGain.gain.linearRampToValueAtTime(0, t + duration);
  breath.connect(breathBand).connect(breathGain).connect(panner);
  breath.start(t);
  breath.stop(t + duration + 0.05);

  const spent: Array<{ disconnect(): void }> = [cup, air, breathBand, breathGain];

  for (const n of notes) {
    const at = t + n.at;
    const end = at + n.hold;

    const gain = context.createGain();
    /* Air has to build. A hard attack is an accordion button, not a breath. */
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(level, at + 0.075);
    gain.gain.setValueAtTime(level, end - 0.14);
    gain.gain.linearRampToValueAtTime(0, end);

    /* Hand tremolo, arriving after the note has settled. */
    const waver = context.createOscillator();
    waver.frequency.value = 5.4;
    const waverDepth = context.createGain();
    waverDepth.gain.setValueAtTime(0, at);
    waverDepth.gain.linearRampToValueAtTime(level * 0.22, at + n.hold * 0.5);
    waver.connect(waverDepth).connect(gain.gain);
    waver.start(at);
    waver.stop(end + 0.05);

    gain.connect(cup);

    /* The pair of reeds, a few cents apart. */
    for (const cents of [-5, 6]) {
      const osc = context.createOscillator();
      osc.setPeriodicWave(wave);
      osc.detune.value = cents;

      if (n.bend) {
        /* Pulled flat, then released into the note. */
        osc.frequency.setValueAtTime(n.note * 2 ** (-n.bend / 12), at);
        osc.frequency.exponentialRampToValueAtTime(n.note, at + 0.22);
      } else {
        osc.frequency.setValueAtTime(n.note, at);
      }

      osc.connect(gain);
      osc.start(at);
      osc.stop(end + 0.05);
      spent.push(osc);
    }

    spent.push(gain, waver, waverDepth);
  }

  /* One teardown for the whole phrase, hung off the breath because it is the
     only node guaranteed to outlive every note in it. */
  breath.onended = () => {
    breath.disconnect();
    for (const node of spent) node.disconnect();
    panner.disconnect();
  };
}
