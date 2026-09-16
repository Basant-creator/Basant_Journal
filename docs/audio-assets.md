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
verified. None was searched for, downloaded, or consulted. The same rule as
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

## Measured behaviour

Verified in a production build by tapping an analyser onto the master gain node
— the only path to the speakers — and by recording every `connect()` the page
makes, so the graph is observed rather than assumed.

| | |
| --- | --- |
| audio before the control is pressed | none: no `AudioContext` is constructed, and nothing reaches the output |
| constructed during SSR | no |
| hydration errors | none |
| console errors with audio running | none |
| buses reaching the output | 5 — environment 0.15, animals 0.22, music 0.30, interaction 0.50, paper 0.75 |
| master | 0.56 |
| nodes connected past the desk | 0 |
| output level, landing | −36.3 dBFS RMS, −22.0 dBFS peak |
| output level, journal | −37.0 dBFS RMS |
| clipping | none; the sum of every peak in the mix is 0.36 of full scale |

**The progression is real, not asserted.** Counting the connections into each
bus over time: the music bus takes nothing at all for the first fourteen
seconds on the landing, then eleven feeds in the following ten. §18's silence
is measured.

**Leaving the landing takes its music and its herd with it.** Over ten seconds
on `/frontier`: music `+0`, animals `+1` (one bird), environment steady at its
two wind layers. On the landing the same window was music `+12` and animals in
the dozens.

**Ducking, sampled every 20 ms across a page turn** — the music bus falls from
0.300 to 0.165 in 60 ms, holds 180 ms, and climbs back over 500 ms. Recovery
measured at 0.72 s against 0.74 s scheduled.

The preference is deliberately **not** remembered between visits. A remembered
"on" resumes on some later unrelated click, which is a surprise to anyone who
has since opened the site in a library or a meeting.
