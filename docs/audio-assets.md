# Audio assets

**There are none.** Every sound on this site is synthesised in the browser at
the moment it plays. No audio file ships, none is fetched, and there is no
licence to establish.

This document exists because §40 of the soundscape brief asks for a licence
manifest, and the honest manifest is a short one — so what follows records what
that claim covers, how to check it, and what would have to change if a recording
were ever added.

---

## The claim, and how to verify it

```
find public -type f \( -name '*.mp3' -o -name '*.wav' -o -name '*.ogg' \
  -o -name '*.m4a' -o -name '*.flac' -o -name '*.opus' -o -name '*.aac' \)
```

Returns nothing. There is no `public/audio` directory, no `<audio>` element
anywhere in the tree, and no `fetch` of a media file. The whole soundscape is
four source files and 1,228 lines:

| file | what it makes |
| --- | --- |
| `lib/audio/atmosphere.ts` | wind bed, campfire embers, paper rustle, survey tick, the rig's lifetime |
| `lib/audio/instruments.ts` | the string, the guitar body, mouth organ, whistle, bowed drone, birds |
| `lib/audio/music.ts` | the Frontier motif — phrases, rests, states |
| `lib/audio/buses.ts` | the mixing desk |

Network cost of the audio: **zero bytes.**

---

## What each sound actually is

Nothing here is a sample, a loop pack, or a recording that has been processed
until it is unrecognisable. Each one is a synthesis method chosen because it
models the physics rather than imitating the result.

| sound | method |
| --- | --- |
| **wind** | brown noise — white noise integrated, so the spectrum falls 6 dB/octave — through two lowpass bands at 380 Hz and 1100 Hz, each gusting on its own slow LFO. Generated into a 4-second buffer whose tail is crossfaded over its head so the loop point lands on a sample that was already heading there. |
| **campfire** | twelve exponential noise bursts placed at random inside a 6-second buffer, through a 1900 Hz bandpass. The randomness is the point: a fire has no tempo, and a regular pop is the tell that a loop is a loop. |
| **the string** | Karplus-Strong. A noise burst trapped in a delay line one wavelength long, losing its high end on each pass. The algorithm is fifty years old and published; the notes played through it are ours. It is deliberately only a *string* — what instrument you are hearing is decided by the body below. |
| **guitar** | the body, and therefore the instrument: peaking filters at 110 Hz (the box's Helmholtz air mode, +5 dB) and 215 Hz (the top plate, +4 dB), then a 3200 Hz lowpass for the wood. Picked softly, so the excitation is darker. Nylon, not steel. |
| **guitar slide** | a ramp on the buffer source's `playbackRate` from a semitone or a whole tone below, over 130 ms. The string is genuinely re-tuned while it rings, exactly as a real one is, rather than crossfaded between two samples. Roughly one note in four. |
| **mouth organ** | a free reed, built as an explicit harmonic series through `createPeriodicWave` — strong fundamental, a long shallow tail of both odd and even partials. Two oscillators five and six cents apart for the beat between a reed pair, a peaking filter sweeping 1500 Hz for the player's hands opening and closing, a 3600 Hz lowpass for brass rather than wire, breath underneath, and an occasional draw bend pulled a semitone or two flat and released. |
| **whistle** | one sine per *phrase*, not per note, gliding between pitches, plus a 7% second harmonic. Scooped into from 6% under, vibrato at two incommensurate rates (4.9 and 6.7 Hz) so the wobble never repeats, a slow 0.6 Hz pitch drift, continuous breath noise underneath, and a sag at the end as the player runs out of air. |
| **birds** | two to four sine sweeps, 50 ms each, over a random base between 2200 and 3800 Hz. |
| **bowed strings** | three sawtooth oscillators detuned by −7, 0 and +6 cents through a lowpass that opens on the attack and closes on the release. A bowed string really is a sawtooth — the Helmholtz kink makes the bridge force one — and the detuning is what turns one instrument into several players who cannot quite agree. |
| **the room** | a generated impulse response through a `ConvolverNode`: 2.6 seconds of stereo noise with a 28 ms pre-delay and a one-pole lowpass whose smoothing rises as the tail ages. No recorded space, no IR file. |
| **paper** | a 160 ms noise burst through an 1800 Hz bandpass. |
| **survey tick** | one sine, 1200 Hz falling to 320 Hz over 22 ms. |

---

## The music

`lib/audio/music.ts` is an original composition, written to §42's brief and to
nothing else: a sparse plucked lead, an occasional human whistle, 84 BPM,
open fifths, and real silence between phrases. The brief said banjo; the owner
asked for guitar instead, and the figures transferred without a note changing
— clawhammer and fingerstyle are the same right hand, and the difference
between those two instruments was never in what was played.

It is **not a transcription, quotation, arrangement or deliberate imitation of
any existing work**, and specifically not of any commercial game soundtrack.
Four figures, three voicings and three whistle lines are written out as note
tables in that file; the scheduler picks between them, never playing the same phrase
twice running, and the rests are as composed as the notes.

The note set is D–F–G–A–C, D minor pentatonic, over a drone that alternates D
and A. That is a bare fifth with no third in it, so the mode is only decided by
whichever note the whistle lands on — which is where the brief's "open,
unresolved" quality comes from, and it costs one missing note rather than a
modulation scheme.

**No generative music service was used**, so no service's output-ownership
terms apply.

---

## What was refused

The brief's §1 rules out extracted game audio, game soundtrack recordings,
YouTube rips of either, and fan uploads whose ownership cannot be independently
verified. None was searched for, downloaded, or consulted.

A commercial game score was later offered as a stylistic reference — a track
from a published soundtrack by its credited composer. It was identified from
its metadata and **not modelled on**: §1 forbids recreating such a composition
and §42 asks for an original Frontier motif instead. What was taken from the
exchange is at the level of idiom rather than material — that a scored western
holds a sustained bed under the plucked parts and puts the whole thing in a
space — and both of those are properties of the genre, implemented here from
first principles. The same rule as
CLAUDE.md's second non-negotiable: the vocabulary is the genre, not any product
inside it.

Free-to-use sample libraries were not used either. That was a choice rather
than a restriction — a CC0 field recording would have been legitimate — but a
licence that has to be tracked is a liability that synthesis does not carry,
and the site already generates its ridges, its torn edges and its dust from
seeds. The wind is the same idea in another medium.

---

## If a recording is ever added

This file becomes a real manifest, and a row may not be left incomplete. Each
entry needs: the file, its source URL, the named rights holder, the exact
licence and its version, whether attribution is required and where it is given,
and the date the licence was read. `docs/landing-assets.md` shows what an
incomplete row looks like. (Its one unverified entry, a horse model marked
`license-review`, has since been removed from the project along with the herd
it belonged to — so at the time of writing nothing in the repository carries
an unresolved licence at all.)

§40 is the rule that settles it: **do not ship an audio file if licensing is
unclear.**

---

## The balance

Retuned on the owner's ear after the first pass: **wind down, lead and whistle
up.** The first balance followed §31's hierarchy literally and put the weather
under everything, which is right for a place you are standing in and wrong for
a place you are being shown.

| bus | was | is |
| --- | --- | --- |
| environment | 0.15 | **0.08** |
| animals | 0.22 | 0.22 |
| music | 0.30 | **0.50** |
| interaction | 0.50 | 0.50 |
| paper | 0.75 | 0.75 |
| master | 0.56 | 0.56 |

The campfire moved with neither: it shares the environment bus with the wind,
so its own gain went 0.5 → 0.94, which is the same product. Camp sounds exactly
as it did and only the weather moved.

**The whistle, rebuilt.** It was a triangle wave retriggered per note, sitting
in the lead's own octave — three separate reasons it read as a synthesiser
rather than a person, and could not be picked out of the mix at all. It is now
a near-pure sine (a human whistle is a Helmholtz resonator and sings at almost
exactly one frequency), one continuous oscillator per phrase that *slides*
between its notes the way a person cannot help doing, and it has moved up an
octave into the range people actually whistle in — which is also the only
range nothing else in the mix occupies.

It was also, measurably, almost never heard. In `sparse` a phrase and its rest
run nine to fourteen seconds, the gate wanted two phrases between whistles, and
the chance was 0.22, so the expected number across a whole visit was under one.
Verified: zero in fifty-four seconds. The rates are now 0.45 / 0.6 / 0.3 with
one phrase of separation instead of two.

**Wind, down again**, and lowered on the wind's own two layers (1 → 0.6 and
0.28 → 0.17) rather than on the bus. The environment bus also carries the
fire, so lowering the bus puts the campfire out with the weather — which has
already had to be undone once with a compensating gain. Lowering the layers
leaves Camp untouched by construction instead of by arithmetic somebody has to
remember.

**The lead is a guitar, and the instrument is the body.** The banjo has been
removed entirely at the owner's request. What is worth recording is how small
that change was in the code and how large it is in the ear: the string model
did not change at all, and neither did a single note.

A banjo and a guitar are not different strings. Both are a string under
tension, plucked, and both are the same delay line. A banjo is what you get
when the resonator is a *drum* — a tensioned membrane with a sharp mid
resonance near 380 Hz, which is why it cuts through anything. A guitar is what
you get when the resonator is a *box of air*, and a box resonates low:
Helmholtz mode near 110 Hz, top plate near 215, and the wood absorbing most of
what is above three kilohertz. One filter chain apart, and they sound nothing
alike. That is why this file models bodies rather than instruments.

Three things moved with the swap. The air peak came down from +7 dB at Q 1.2 to
+5 dB at Q 1.0, because the figures pedal on D3 and a 147 Hz fundamental sat on
the shoulder of that peak and boomed. The lowpass opened from 2600 to 3200 Hz,
because the instrument carries the tune now and at 2600 the melody above the
third string went muddy. And notes ring for 2.1-2.8 s instead of 1.6-2.1:
1.6 s on gut is a note being stopped, not a note ending.

The **rolled chords** stay, in the gap rather than underneath: four notes
placed nearly a beat after the figure ends, so its last note has somewhere to
ring. That mattered more when the two were different instruments and one could
bury the other; now it is simply what a player does — state a line, then let a
chord ring under the silence after it. The voicings are stacks of fourths and
fifths with one colour note: there is no third anywhere in the five-note set,
so a voicing cannot accidentally resolve the mode the drone spends the whole
piece leaving open.

**A bed and a room.** The motif now carries a bowed drone on D2 and A2,
alternating, each note held 15–21 seconds and overlapping the next by four so
the handover is a crossfade rather than a gap. It runs on its own clock, not
the phrase cursor: the guitar rests for up to sixteen beats and a bed that
stopped during the rests would be pointless. Music and animals are sent to the
generated room — 0.34 and 0.55 — post-fader, so ducking the music ducks its
reverb with it. Wind, interface ticks and paper stay dry: wind is already
diffuse, a tick must be immediate or it feels laggy, and inside the book the
page is *here*.

The drone is released rather than left to ring. It holds for twenty seconds,
so `setMusic("silence")` fades every sounding one over 1.6 s — measured, the
music is gone 5.19 s after leaving the landing, which is that fade plus the
2.6 s tail.

A **limiter** now sits between the master and the speakers — threshold −6 dBFS,
ratio 20:1, 3 ms attack. A guitar phrase holds notes for nearly three seconds, so
four can ring at once; nothing guarantees their peaks never align, and digital
clipping is a buzz rather than a soft failure. In normal playing it does
essentially nothing: maximum gain reduction measured over a 69-second run was
**0.04 dB**.

---

## Measured behaviour

Verified in a production build by tapping an analyser onto each bus and onto
the master — the only path to the speakers — and by recording every `connect()`
the page makes, so the graph is observed rather than assumed. Figures below are
from a single 69-second run on the landing with no route change and no dropped
frames.

| | |
| --- | --- |
| audio before the control is pressed | none: after 30 s on the page, no `AudioContext` exists |
| constructed during SSR | no |
| hydration errors | none |
| console errors with audio running | none |
| buses reaching the output | 5, each at its declared level |
| nodes connected past the desk | 0 |
| wind | 0.0088 RMS / 0.0457 peak |
| music | 0.0489 RMS / 0.2871 peak |
| **whistle band (620–1300 Hz) peak** | **−31.8 dB, at 879 Hz** — A5, exactly the written note |
| **lead band (140–530 Hz) peak** | −40.8 dB |
| **whistle over the lead** | **+9.0 dB**, in a band the lead does not occupy |
| guitar | 18 notes over 49 s in `reflective`, the sparsest state |
| output | −32.5 dBFS RMS, −17.6 dBFS peak |
| clipping | none; peak is 0.13 against the limiter's 0.50 threshold |
| limiter gain reduction | 0.07 dB maximum |
| music gone after leaving the landing | 5.19 s |

Before the drone, the music bus sounded in 55% of frames and rested in the
gaps. With it, 83% — the rests are still there in the figures, but the music no
longer stops existing between phrases.

**The progression is real, not asserted.** With the sound switched on from
cold, the music bus carries nothing for the first twelve to fourteen seconds
and then begins. §18's silence is measured.

**The clock starts when the sound does.** The landing's progression is driven
by `onStart` rather than by mount, so a visitor who reads for half a minute and
then presses the control still gets the landscape before the guitar. Measured
from a page left 30 seconds with the sound off: first note at 12.4 s after
switch-on.

**Leaving the landing takes its music with it.** Over ten seconds on
`/frontier`: music `+0` feeds, animals `+1` (one bird), environment steady at
its two wind layers. On the landing the same window was music `+12`.

(That measurement predates the herd's removal. The hoofbeats it mentions are
gone with the horses; birds and wind are what the animals bus carries now.)

**Ducking, sampled every 20 ms across a page turn** — the music bus falls from
0.500 to 0.275 in 60 ms, holds 180 ms, and climbs back over 500 ms. Recovery
measured at 0.73 s against 0.74 s scheduled. The floor is exactly 0.55 of rest,
so the duck is a proportion of whatever the bus is set to rather than a level
of its own.

The preference is deliberately **not** remembered between visits. A remembered
"on" resumes on some later unrelated click, which is a surprise to anyone who
has since opened the site in a library or a meeting.

---

## What the composition system can actually make

Taken from `lib/audio/instruments.ts` and `lib/audio/atmosphere.ts` rather
than from memory, because the brief that prompted this section is right that
an instrument you assume exists is the one that turns out not to.

### Melodic

| | what it is |
| --- | --- |
| `guitar()` | A plucked string: Karplus-Strong on a shared excitation buffer, resampled for pitch. Dry attack, natural decay, a peaking body around 110 and 215 Hz, and `slideFrom` for a slide into the note. This is the nearest thing to an acoustic guitar here and there is no sampled one. |
| `whistle()` | A person whistling. One continuous sine per phrase that slides between its pitches, two vibratos at incommensurate rates so it never sounds cyclic, continuous breath noise, and a sag at the end of a held note. |
| `harmonica()` | A free reed, built with `createPeriodicWave` from twelve measured partials. Bends. |
| `chirp()` | A bird. Wildlife rather than an instrument, and on the animals bus. |

### Low end

| | what it is |
| --- | --- |
| `bow()` | A sustained bowed tone — three sawtooths detuned by −7, 0 and +6 cents — returning a handle with `release()`. Both cues use it as the drone at D2 and A2. |

There is no bass instrument. The low end *is* the drone.

### Rhythmic

**Nothing.** There is no percussion of any kind. `hoof()` existed and was
deleted with the horses; `triggerSurveyTick()` is an interface tick on the
interaction bus and `triggerPaperRustle()` is paper. So a cue asking for
"subtle percussion if required" gets none — not as a restraint but as a fact
about the palette. Both cues are guitar, whistle, drone, and in the Frontier
cue a reed.

### Atmospheric

| | what it is |
| --- | --- |
| `noiseBed()` + `layer()` | Wind. Two filtered noise layers with slow LFO movement, at 0.6 and 0.17. |
| `emberBed()` / `lightFire()` | Fire. Camp only, and a fact about a place rather than a musical decision. |
| `bow()` | Doubling as the bed, above. |

Everything is synthesised at runtime. Nothing here is a sample and there is no
sample library to audit — which is also the answer to "what soundfont is in
this project": none, by design, and the licence section below is why.

## Two cues, and what neither of them is

There are now two pieces of music for the landing, compared behind a
development switch. Only one is selectable in a production build — the
Frontier cue — and the switch itself is not in that build at all: the panel
and its stylesheet leave the bundle, verified by searching the output for its
markup, its labels and its CSS class, all of which return zero files.

**Frontier** — 84 BPM, pedal-and-melody figures on the guitar, a whistle and
a mouth organ. The original motif, unchanged.

**Standoff** — 66 BPM, three notes in twelve beats, no pedal, no reed, gaps of
eleven to twenty-four seconds, and an occasional tremolo. Written for a brief
that names a film and then spends a paragraph forbidding it.

That prohibition is the reason this section exists. The standoff cue was
written from the situation the brief describes — a wide empty country and
somebody waiting in it — and not from any recording of it. Concretely, what it
does instead:

- **The tension is a mode, not a motif.** A flat second, E-flat over a D drone,
  sounded and left to grind. Phrygian colour. A scale degree belongs to nobody.
- **No rising third, no octave leap.** The figure the brief is steering around
  is built on both; there is no such interval anywhere in the cue. Its
  intervals are falling fourths and fifths and one semitone.
- **No ostinato.** Nothing in it keeps time. The low string is struck for its
  resonance and then left, which is the opposite of a driving two-beat.
- **The whistle is two notes.** Falling, held, and rare — a call across
  distance rather than a tune anybody could carry away.

Still zero audio files. Both cues are synthesised at runtime from the same
instruments, and the licence position is unchanged: there is nothing to
license because there is nothing to ship.
