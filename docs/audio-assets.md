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
| `lib/audio/instruments.ts` | banjo, whistle, hooves, birds |
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
| **banjo** | Karplus-Strong. A noise burst trapped in a delay line one wavelength long, losing its high end on each pass, with a 380 Hz bandpass standing in for the drum head. The algorithm is fifty years old and published; the notes played through it are ours. |
| **whistle** | a triangle oscillator scooped into pitch from 6% under, with vibrato that arrives late, and a 120 ms band of breath noise in front of the tone. |
| **hooves** | a 90 ms noise burst with a 12 ms exponential decay, a peaking filter at 130 Hz for the thump, and a lowpass that closes from 2400 Hz to 700 Hz with distance — air eats treble before it eats loudness. |
| **birds** | two to four sine sweeps, 50 ms each, over a random base between 2200 and 3800 Hz. |
| **bowed strings** | three sawtooth oscillators detuned by −7, 0 and +6 cents through a lowpass that opens on the attack and closes on the release. A bowed string really is a sawtooth — the Helmholtz kink makes the bridge force one — and the detuning is what turns one instrument into several players who cannot quite agree. |
| **the room** | a generated impulse response through a `ConvolverNode`: 2.6 seconds of stereo noise with a 28 ms pre-delay and a one-pole lowpass whose smoothing rises as the tail ages. No recorded space, no IR file. |
| **paper** | a 160 ms noise burst through an 1800 Hz bandpass. |
| **survey tick** | one sine, 1200 Hz falling to 320 Hz over 22 ms. |

---

## The music

`lib/audio/music.ts` is an original composition, written to §42's brief and to
nothing else: sparse banjo, an occasional human whistle, 84 BPM, open fifths,
and real silence between phrases.

It is **not a transcription, quotation, arrangement or deliberate imitation of
any existing work**, and specifically not of any commercial game soundtrack.
Four banjo phrases and three whistle lines are written out as note tables in
that file; the scheduler picks between them, never playing the same phrase
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
incomplete row looks like — the horse model is marked `license-review` because
it arrived attributed but unverified, and "probably CC0" is not the same as
knowing.

§40 is the rule that settles it: **do not ship an audio file if licensing is
unclear.**

---

## The balance

Retuned on the owner's ear after the first pass: **wind down, banjo and whistle
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

**A bed and a room.** The motif now carries a bowed drone on D2 and A2,
alternating, each note held 15–21 seconds and overlapping the next by four so
the handover is a crossfade rather than a gap. It runs on its own clock, not
the phrase cursor: the banjo rests for up to sixteen beats and a bed that
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
ratio 20:1, 3 ms attack. A banjo phrase holds notes for up to two seconds, so
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
| wind | 0.0131 RMS / 0.0514 peak |
| music | 0.0403 RMS / 0.2639 peak, sounding in 599 of 722 frames |
| **music peak over wind peak** | **5.13×** — was 0.80× before any of this |
| output | −32.0 dBFS RMS, −16.7 dBFS peak |
| clipping | none |
| limiter gain reduction | 0.03 dB maximum |
| music gone after leaving the landing | 5.19 s |

Before the drone, the music bus sounded in 55% of frames and rested in the
gaps. With it, 83% — the rests are still there in the banjo, but the music no
longer stops existing between phrases.

**The progression is real, not asserted.** With the sound switched on from
cold, the music bus carries nothing for the first twelve to fourteen seconds
and then begins. §18's silence is measured.

**The clock starts when the sound does.** The landing's progression is driven
by `onStart` rather than by mount, so a visitor who reads for half a minute and
then presses the control still gets the landscape before the banjo. Measured
from a page left 30 seconds with the sound off: first note at 12.4 s after
switch-on.

**Leaving the landing takes its music and its herd with it.** Over ten seconds
on `/frontier`: music `+0` feeds, animals `+1` (one bird), environment steady
at its two wind layers. On the landing the same window was music `+12`.

**Ducking, sampled every 20 ms across a page turn** — the music bus falls from
0.500 to 0.275 in 60 ms, holds 180 ms, and climbs back over 500 ms. Recovery
measured at 0.73 s against 0.74 s scheduled. The floor is exactly 0.55 of rest,
so the duck is a proportion of whatever the bus is set to rather than a level
of its own.

The preference is deliberately **not** remembered between visits. A remembered
"on" resumes on some later unrelated click, which is a surprise to anyone who
has since opened the site in a library or a meeting.
