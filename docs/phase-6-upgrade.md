# Phase 6 — the high-fidelity upgrade

Phase 6 was being built to one target and is now being built to another. The
architecture does not change: the route system, the transition system, the
chapter registry, the content model, the 3D boundary, the DOM bridge and the
illustrated fallback all stand. What changes is how much quality the scene is
expected to carry, and where that quality is allowed to cost anything.

## The target

| | |
| --- | --- |
| Was | A stylised, low-poly frontier campsite. |
| Is | A high-fidelity cinematic frontier diorama, rendered in real time. |

The distinction that matters is in §1 of the upgrade brief: the illusion of
AAA quality is to come from **composition, materials, lighting, texture
detail, asset prioritisation and controlled camera framing** — not from
polygon count or asset density. That is the whole reason this is achievable
inside a Next.js app that also has to stay a portfolio.

## What this cannot do by itself

Nothing in this repository can author a 3D model or a scanned PBR material,
and the project's own first rule forbids shipping somebody else's. So:

- **§25 (GLB/GLTF), §26 (texture compression), §12 (high-resolution
  textures), §24 (asset folders)** are scaffolded, not populated. The loading
  path, the folder structure and the tier-selected resolutions can be built
  and tested against procedural stand-ins; the assets themselves need either
  to be authored or to be licensed from a source the project has agreed to.
- Everything else in the brief is reachable procedurally, and that is where
  the quality is being spent: geometry detail, material distinction, canvas-
  generated texture, lighting, fog, fire, instanced variation, camera and
  post-processing.

This is a real ceiling, and it should be decided rather than discovered late.

## §17, the photograph

The brief says that if no real photograph is provided, do not fabricate one.
One **is** provided — `public/portrait/basant.jpg` — and it is already what
both the record and the scene print. §17's substitute path therefore does not
apply, and nothing here invents a likeness.

## Where the work actually stands

The upgrade renumbers the order. Mapped against what is already built and
committed:

| # | Step | State |
| --- | --- | --- |
| 01 | Preserve scene architecture | held |
| 02 | Upgrade the quality target | this document |
| 03 | Quality-tier system | done |
| 04 | High-fidelity lighting | done — rim light for separation, shadows scoped to the near field |
| 05 | Sky / dusk environment | done — dithered ramp, horizontal falloff from where the sun set |
| 06 | Terrain | done — displaced near mesh over a flat far plane, shared height field |
| 07 | Vegetation, instanced | done — 4 tree, 4 rock, 3 shrub variants, seeded 23/23/22/16 |
| 08 | Camp structure | done — built tent walls with ridge sag and panel bow; a chair |
| 09 | Hero props | done — plank/grain/knot timber, trestle frame |
| 10 | Campfire | done — scrolling flame texture, tiles at 1e-15; bed of coals |
| 11 | Smoke / atmosphere | done — one shared breeze; puffs with ragged edges; fog measured |
| 12 | Notebook | done — pages made visible, leather grain, page-edge stack |
| 13 | Survey map | done — drawn from terrain/trails/locations, the real sheet |
| 14 | Photograph | done — paper stock, emulsion sheen at 0.55, curled corner |
| 15 | Lantern | done — flame inside glass, three uprights, one shared flicker |
| 16 | Cinematic camera | done — 36 deg (37mm); objects +15%, gaps wider; no DoF, and why |
| 17 | Arrival sequence | done — start lowered to 3.6m so the band sits at 10% not 0.7% |
| 18 | Notebook interaction | done — contact shadow, spreads and pales with the lift |
| 19 | Map interaction | done — contact shadow; route accent already carried §18 |
| 20 | Photograph interaction | done — verified rather than extended; see below |
| 21 | Field Notes interaction | done — verified rather than extended; see below |
| 22 | 3D → DOM bridge | done — gaps 3.1 / 2.8 / 3.0; the hit areas were another matter, see 31 |
| 23 | Notebook → Paper | done — the page comes off the object, once the curtain is up |
| 24 | Map → Camp | done and measured |
| 25 | Camp → Map | done and measured |
| 26 | Mobile quality tier | done — phones draw at LOW; the connection gate later proved too sharp, see 28 |
| 27 | WebGL fallback | done — and it was rendering at zero height |
| 28 | Resource disposal | done — the disposal code ran and reached nothing |
| 29 | Performance profiling | done — a dev overlay that ships nothing, and the numbers |
| 30 | Accessibility / reduced motion | done and audited |
| 31 | Production verification | done — and the notebook had been handing its clicks away |

## The decision that was open, and how it went

§31 named **LOW — mobile / weaker GPU** as a rendering tier and reserved
FALLBACK for WebGL being unavailable, which is a deliberate distinction
between a phone that should draw less and a phone that should not draw at
all. The shipped behaviour was the second one for every phone: an 860px
width test sent them all to the illustrated camp.

Resolved in favour of the brief at upgrade 26. The width test still exists
and no longer decides anything on its own — it hands the question to the
quality tier, which asks about the machine rather than the window.

The budget argument that justified the old behaviour has not been discarded,
it has been made specific. §39 asks that the Camp not destroy initial page
performance and that the portfolio not be sacrificed for one scene, and
neither is satisfied by sending 880kB of renderer down a 2G connection to
draw a campfire. So the probe reads `saveData` and `effectiveType`. Absent is
not slow: most browsers do not implement the API, and guessing badly there
costs someone the whole scene — which is exactly what 3G did until upgrade 28
softened it from a refusal to a tier below. The table already reflects that.

| case | tier |
| --- | --- |
| desktop, capable | high |
| laptop, 4 cores | medium |
| phone on 4G | **low** |
| tablet, 2GB | low |
| old GPU, 2048 max texture | low |
| phone with Save-Data on | fallback |
| phone on 3G | **low** — see 28 |
| phone on 2G or slow-2g | fallback |
| software rasteriser | fallback |
| no WebGL | fallback |

A software rasteriser reports WebGL and is not a GPU. It would draw this
scene at a handful of frames a second, which is worse than the illustrated
camp in every way that matters.

## What steps 20 and 21 turned out to be

They add no new response to the photograph or the field notes, and that is
the finding rather than a shortfall.

§36 asks a hero object for five things when it is reached for: highlight,
tiny movement, shadow change, label, focus. All five are already there for
all four objects — warmth, lift, contact shadow, and the label and focus ring
the DOM control carries. The map has a sixth because §18 asks for the route
by name. A sixth on the photograph or the notes would run straight into §21,
which says not every object needs to be a button, and §23, which caps the
vocabulary at small enough that you notice the object rather than the effect.

What those steps owed instead was proof that the wiring is connected, because
a null ref in `useObjectResponse` fails completely silently: the object does
not respond and nothing anywhere says so. That is not hypothetical — it is
the shape of the bug found at upgrade 12, where the notebook page block had
been drawn every frame inside a solid cover since the day it was written.

Probed each object in turn, reading the hook state for whichever was hovered:

| | group | face | shade | accent | y | emissive | shade scale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rest | yes | yes | yes | no | 0.7400 | 0.000 | 1.000 |
| notebook | yes | yes | yes | no | 0.7620 | 0.160 | 1.136 |
| photograph | yes | yes | yes | no | 0.7620 | 0.160 | 1.136 |
| field notes | yes | yes | yes | no | 0.7620 | 0.160 | 1.136 |
| map | yes | yes | yes | **yes** | 0.7620 | 0.160 | 1.136 |

Every path connected, every object lifting 22mm, warming to 0.16 and
spreading its shadow to 1.136 — and `accent` present on the map alone, which
is correct.

## One build note

A `next/font` error appeared once during a build immediately after clearing
`.next`, and did not reproduce: two further builds exit 0 with every route
present. It is the Google Fonts fetch `next/font` performs at build time
failing on a cold cache. Harmless locally, and worth knowing before it
happens in CI on a bad network.

## Step 28: the disposal code ran, and reached nothing

Every generated texture and every hand-built geometry in the Camp already had
a `dispose()` hanging off its own effect. The audit found no gaps: fifteen
texture hooks, four geometry hooks, all with cleanups, all correct on the page.

Then it was measured, by counting the WebGL calls themselves — patch
`getContext` before the scene mounts, wrap `createTexture`/`deleteTexture`
and their siblings on the context three is handed, walk into `/about`, walk
out, and read the tally. Leaving released:

| | created | released before | released after |
| --- | --- | --- | --- |
| vertex buffers | 466 | 466 | 466 |
| vertex arrays | 157 | 157 | 157 |
| textures | 25 | **0** | 19 |
| programs | 16 | **0** | 15 |
| framebuffers | 9 | **0** | 6 |

Geometry came back and nothing else did.

### Why

Tracing `Texture.prototype.dispose` against the GL calls put the two apart by
four milliseconds. React tears the page down; `SceneCanvas` schedules the
context release a task later; R3F unmounts its own reconciler root
asynchronously. So `renderer.dispose()` ran at +11ms and the tree that owns
the textures unmounted at +15ms. `renderer.dispose()` clears the properties
map on its way out, and `deallocateTexture` returns early for any texture
whose `__webglInit` it can no longer find — so the twenty-two
`texture.dispose()` calls that did arrive, at +20ms, all ran to completion
against a renderer with no record of them.

The renderer was being disposed before the scene it owns. Nothing in either
file is wrong on its own; the order was the bug, and the order was nobody's.

Nothing leaked, because `forceContextLoss()` follows a line later and the
driver reclaims everything. That is luck rather than design, and it only
holds for unmount: the same inversion leaks for real wherever a texture is
released while the scene is alive — a tier change regenerating every canvas,
a prop remounting, the photograph arriving late and replacing the one already
uploaded.

### The fix

Take the order rather than race it. At the moment the teardown runs the scene
is still intact, because R3F has not reached it: walk it, release the
geometries, the materials, every texture each material is holding and the
shadow map, and *then* dispose the renderer. R3F's pass follows and finds the
work done, which costs nothing — `dispose()` is idempotent.

Textures are found by scanning each material's own properties for `isTexture`
rather than by naming slots. Naming `map`, `alphaMap`, `emissiveMap` one by
one means the next map somebody adds is a texture nobody releases, and the
omission is invisible until something measures it again.

### What is left, and whose it is

Six of twenty-five textures survive on HIGH. They were identified by their
bind targets rather than assumed:

| | | |
| --- | --- | --- |
| 1 | `TEXTURE_2D`, 1x1 | three's placeholder |
| 2 | `TEXTURE_CUBE_MAP` | three's placeholder |
| 3 | `TEXTURE_2D_ARRAY` | three's placeholder |
| 4 | `TEXTURE_3D` | three's placeholder |
| 9 | `TEXTURE_2D`, 16-wide RG16F | three's internal lookup |
| 6 | `TEXTURE_CUBE_MAP`, 1024x1024 | the fire's shadow map |

The first five are created before the first shader is compiled — they belong
to the renderer, not to the scene, and they are correct to leave. Running the
LOW tier, which has no shadow pass, removes the sixth: 18 of 23 released, and
every one of the five remaining is on that list. **Nothing the scene owns is
left on either tier.**

The shadow cube is the renderer's too, allocated by the shadow pass rather
than by any scene code. Disposing `light.shadow.map` releases its six
framebuffers and leaves the texture handle, because `deallocateTexture` wants
a `__webglInit` that only ordinary uploads set. Naming
`shadow.map.texture` as well was tried and changed nothing, so it is not in
the code. Four megabytes, for the microsecond before the context dies.

### Two things found while measuring

**A capable desktop was being sent to the illustrated camp.** Halfway through,
`/about` stopped drawing: scene mode `reduced` on a sixteen-core machine with
16GB and a Radeon 780M reporting a 16384 maximum texture. The cause was
`navigator.connection.effectiveType` returning `"3g"` — on localhost, on that
machine — which `tierFor` was treating as a refusal alongside 2G.

`effectiveType` is a rolling estimate of recent round trips, and with little
traffic to go on it reports whatever it last believed. It said `3g` one
minute and `4g` the next, on the same page, on the same machine.

That is the §32 mistake wearing different clothes. A user-agent string is a
claim about the device; `effectiveType` is a guess about the network; neither
is evidence about whether a GPU can draw a campfire. Both are fine as one
input among several and wrong as a veto.

So 3G now moves the tier down a step instead of refusing: the scene arrives
at one device pixel, without shadows, with a third of the grass. 2G and
`slow-2g` still fall back — a link that slow is unarguable — and so does
`saveData`, which is the one signal a visitor sets on purpose. Verified by
forcing `effectiveType` to `"3g"` and walking in: mode `ready`, canvas
618x346 against a 618 CSS box, which is the LOW tier's `dpr: [1, 1]` exactly.

**Three WebGL contexts were being created per mount and thrown away.**
`hasWebGL` asked for one, `probeQuality` asked again, `detectQualityTier`
asked a third time — and all three again on every media-query recheck. A
context costs 4.4ms median here (nine runs, 3.5–6.7): 15.8ms of synchronous
main thread, during the mount of the one page that is supposed to feel
effortless, to answer a question about a graphics card nobody is going to
swap mid-visit.

The GPU half of the probe is now asked once and remembered. The half that can
genuinely change — device pixel ratio, screen size, pointer, connection — is
still read fresh every call, which is the point of not caching the whole
thing. Measured after: **two contexts for a whole visit**, one probe and one
renderer, down from four.

### Verified after

| | |
| --- | --- |
| textures released | 19/25 HIGH, 18/23 LOW — scene textures, all |
| buffers / vertex arrays | 466/466, 157/157 |
| contexts per visit | 2, both lost on leaving |
| canvases after leaving | 0, `--anchor-notebook-x` cleared |
| 3G desktop | draws, at LOW, dpr 1 |
| no WebGL at all | illustrated camp, 618x347, three tabs, panel populated |
| tier table | 15 cases re-checked against an independent expectation |

## Step 29: the overlay, and what it found

§38 asks for a development readout of what the scene costs. It is in two
pieces because the numbers sit on two sides of a wall: everything about a
frame can only be read from inside a `useFrame`, and everything about a panel
is DOM and cannot be inside a Canvas. The sampler writes into a ref four times
a second and the panel reads it on a timer — a profiler that re-renders React
sixty times a second is measuring itself.

It reports tier, frame rate, draw calls, triangles, geometries, textures and
their estimated bytes, programs, pixel ratio, and §38's two load times. Frame
rate reads "paused" rather than a stale number when the loop has stopped,
which it does whenever the canvas scrolls out of view or the tab is hidden.

**It ships nothing.** `process.env.NODE_ENV` is a literal at build time, so
the dynamic import behind it is unreachable code and webpack never emits the
chunk. Verified rather than assumed: no file under `.next/static` contains
`SceneStats`, `pixel ratio`, `asset load`, `markScene` or `sceneTimings`, and
`/about` is unchanged at 3.83 kB / 131 kB against a 104 kB shared bundle.

### The panel could not be seen, and the reason is worth keeping

Fixed to the bottom-right at `z-index: 160`, it rendered *underneath* the
record paper — which sets no z-index at all.

`ThreeScene`'s picture layer carries `z-index: 0` with `position: absolute`,
and that makes it a stacking context. A `position: fixed` element does not
escape one: the panel's 160 was being resolved inside a layer that itself
sits at 0, so anything painted later in the document covered it. Measured
with `elementFromPoint` at the panel's own centre, which returned the
record's body text.

Same family as upgrade 27. There a position rule collapsed a box to zero
height; here a z-index rule quietly redefines what "on top" means, three
ancestors away from the element that looks wrong. The transition readout
never hits it because it is mounted in the root layout, outside every scene
layer — so the panel is portalled to the body, where that one already lives.

### What the scene costs

Measured in production at 1100x820 with a device pixel ratio of 2, so the
renderer is filling 2200x1640.

| | |
| --- | --- |
| draw calls | 114 at rest, 204 while the shadow pass runs |
| triangles | 21,991 |
| geometries | 114 |
| textures | 20, about 32.0 MB |
| programs | 16 |
| frame rate | 120 fps sustained, at the pane's refresh ceiling |

The draw-call pair is the frozen shadow earning its keep twice over. §04
renders the fire's shadow for six frames and then sets `autoUpdate = false`;
before it freezes, the six faces of the point light's cube cost 90 extra draw
calls per frame — 78% on top of the whole rest of the scene, for a shadow
that never moves again.

**24 of those 32 megabytes are that one shadow map.** 1024 x 1024, four bytes
a texel, six faces. Every canvas this scene draws for itself — the timber,
the leather, the paper, the flame, the map, the photograph, the ground, the
sky — comes to about 8 MB between them. Halving the shadow to 512 would
return roughly 19 MB, and it is rendered six times and then frozen on a scene
that is deliberately soft. Not changed here: it is a tier decision and it
changes how the scene looks, so it wants a pair of eyes on it rather than an
arithmetic argument.

### Arrival

| | high, warm | low, cold shaders | low, warm |
| --- | --- | --- | --- |
| canvas mounts | 2973 ms | 2973 ms | 2973 ms |
| first frame drawn | 3293 ms | 4180 ms | 3265 ms |
| main thread blocked | 54 + 204 = **258 ms** | 52 + 529 = **581 ms** | 86 + 59 + 148 = **293 ms** |

The mount time is identical to the millisecond across every run because
nothing about it is a guess: the chapter card, the 2600ms transition guard
and the settle are fixed durations, and the scene waits for all of them by
design. §19's reason for that still holds — an arrival that plays behind a
curtain is an arrival nobody sees.

The first frame costs about a quarter of a second of main thread, in two
tasks, and it lands after the page is already interactive. It is a hitch, not
a block.

**Cold shaders are most of it.** The low tier's first ever frame blocked for
581 ms; the same tier's second visit blocked for 293 ms, with nothing else
changed. Compiling sixteen programs against a driver that has not seen them
before is roughly 290 ms of that number, paid once per shader set per
machine. Which also means the tiers cannot be compared against each other
within one session — whichever runs first pays for the compiler, and reading
that as "LOW is more expensive than HIGH" would be exactly backwards.

### Delivery

| | |
| --- | --- |
| renderer chunks | 3, 231 kB encoded (99 + 87 + 45) |
| fetched | after the transition reaches IDLE, never before |
| /about | 3.83 kB, 131 kB first load |
| shared bundle | 104 kB, unchanged |

### One correction

Earlier in this phase I recorded that sustained frame rate cannot be measured
in this browser pane, because `requestAnimationFrame` only fires while it
paints — a scene drew 3 frames across ten seconds of waiting. That is true of
a pane that is hidden and not true of one that is not: with the pane
foregrounded the counter caught 2,068 frames and a steady 120 fps. The
limitation is that it stops, not that it lies. `CLAUDE.md` already says to
take a screenshot before believing a zero; the same applies to believing a
frame rate.

## Step 31: production verification

Against a clean build, in `next start`, at 1280x860 and again at 400x300.

### Checked, and what it showed

| | | |
| --- | --- | --- |
| §23 | the homepage must not load the Camp | **0** WebGL contexts asked for, 0 canvases, no scene element, 190 kB of script across 16 files. Checked statically too: no chunk the homepage document references contains `WebGLRenderer` |
| §31 | tiers draw what they should | HIGH: dpr 2, shadows, 1398x784. LOW: dpr 1. Both `ready`, both anchored |
| §26 | a small viewport still draws | 400x300: mode `ready`, canvas present, controls as a row of 44px chips, no anchors — the mobile presentation, on a drawn scene |
| §36 | objects answer the pointer | hovering the photograph with a real pointer: `:hover` true, its label at 0.99, its neighbours at 0 |
| §30 | keyboard, roving tabindex | click selects, ArrowRight moves to Field notes, tabindex goes -1/-1/0, the panel follows, `aria-labelledby` resolves |
| §17 | no fabricated portrait | `/portrait/basant-small.jpg`, a supplied file. Nothing generated |
| §33 | nothing left behind | 19/25 textures, 466/466 buffers, 157/157 vertex arrays, both contexts lost, anchors cleared (upgrade 28) |
| §38 | the overlay ships nothing | no `SceneStats`, `markScene` or `sceneTimings` anywhere under `.next/static` |
| §39 | the portfolio is not sacrificed | `/about` 3.83 kB / 131 kB, shared bundle 104 kB, unchanged across all of this |
| | console, clean tab | **no errors**; the remaining warnings are R3F's `THREE.Clock` deprecation and Next's CSS preload notices |
| | `/frontier` | unaffected: survey renders, scene `ready`, no errors |

### Pointing at the notebook activated the wrong thing, a third of the time

The controls over an anchored scene are the objects' own projected footprints
— 15 to 23 pixels across, because a notebook on a table sixteen metres away is
small. Each carries its name as an absolutely positioned child, `opacity: 0`
until the object is hovered or selected, `white-space: nowrap`, eighty to a
hundred pixels wide.

An absolutely positioned child is still a descendant. It keeps its parent's
hit area whatever it overhangs, and `opacity: 0` hides a thing from the eye
and from nothing else. So three invisible names lay across each other and
across their objects, and the browser handed each click to whichever came last
in the DOM.

Measured on a 6x6 grid over each object's own box:

| aiming at | landed on itself | stolen by |
| --- | --- | --- |
| Notebook | 24 / 36 | Field notes 8, Photograph 4 |
| Photograph | 30 / 36 | Field notes 6 |
| Field notes | 36 / 36 | — |
| Map | 36 / 36 | — |

The notebook is the object the page asks you to pick up, and a third of it
belonged to something else. Nothing looked wrong, because the thief was
invisible; the labels themselves never overlap on screen, since only one is
ever shown.

`pointer-events: none` on the anchored label — which is what the comment above
that rule already claimed, having been written as "out of the flex flow
entirely, so the width of the hit area cannot wrap it or clip it". After:
**36/36 on all four**, nothing stolen.

Step 22 measured that the visible boxes did not collide. That was true, and it
was not the question.

### The shadows were never soft

The console said so: `THREE.WebGLShadowMap: PCFSoftShadowMap has been removed.
Using PCFShadowMap instead.` Deprecated in three r186 and gone. The constant
still exports, so `shadows={{ type: PCFSoftShadowMap }}` compiled and typed
and ran, and the renderer quietly substituted the hard one. Every shadow in
every screenshot in this document was already PCF.

Named rather than restored. VSM is the remaining soft option and three does
not support it for point lights, which is the only shadow-casting light here;
and the fire's shadow is rendered six times and then frozen at a size where
the difference is a pixel of penumbra. The code now says what the GPU does.

### And the profiler was throwing

`Target container is not a DOM element` from `<SceneStatsPanel>`, three times
per load, caught by the route's error boundary — so the panel recovered,
rendered, and worked, and the only evidence was red text nobody had reason to
read. `createPortal` was being handed `document.body` during render. It now
takes the host from an effect.

Worth the fix for a development-only component, because a tool that cries wolf
on every load trains you to stop reading the console — and the console is
where both of the bugs above were found.

## What is not done

The phase is not finished, and this is the list.

~~**§37, the notebook opening into the Paper.**~~ Built after this list
was written; see the section below it.

**Assets.** §12, §24, §25 and §26 are scaffolded, not populated. I cannot
author or source GLB models or PBR texture sets; every surface in this scene
is a canvas it drew for itself. A licensed CC0 source (Poly Haven,
Quaternius) or supplied assets would change what §01's "illusion of AAA" can
reach.

**`SITE_ORIGIN`** in `lib/routes.ts` is still `https://basantbhushan.dev`, a
placeholder. It is the only thing actually blocking a deploy.

**The fire's shadow map**, 24 MB of the scene's 32. Halving it returns about
19 MB; it changes how the scene looks, so it is a decision.

**MetricPanel's unit red** measures 3.94:1 on the tan mat and needs a darker
red. A palette decision, not a code one.

**The lantern** is named among §36's hero interactive objects and is
decorative, because §22 caps interaction at four objects that exclude it.

**Brass metalness is capped at 0.55** because a metal in three without an
`envMap` goes black, and an envMap is a scene-wide lighting pass.

**A `next/font` build error** appeared once on a cold `.next` and has not
reproduced across every build since. It is the Google Fonts fetch failing;
harmless locally, and worth knowing before it happens in CI on a bad network.

**Next preloads CSS it does not use** — eight or nine warnings a load. A
framework behaviour with this many CSS modules, not a regression, and not
investigated.

## §37: the page comes off the object

Both halves of this had been built and never introduced. The notebook's cover
swings open in the scene when it is reached for — upgrade 18 put it there. A
sheet of paper beside the scene carries what the notebook holds — it has
carried it since the route was written. The cover opened, and somewhere else
on the page a different rectangle changed its text.

Three things now make the page read as having come out of the object.

**Direction, measured.** `useSheetArrival` reads the real gap between the
object's own control and the sheet at the instant the sheet mounts, and writes
it as `--arrive-x` / `--arrive-y` scaled to 18% of itself and capped at 130px.
The sheet travels a fraction of the distance in the whole of the direction:
far enough that the eye follows it from where it was already looking, short
enough that it is a gesture and not a journey. It has to be measured rather
than guessed because the object moves — the camera arrives over 1900ms, every
viewport puts the table somewhere else, and on a phone the control is a chip
under the scene rather than a point on a table.

**A turn.** A page lifted out of a book does not arrive square.

**A fold**, for the notebook alone. It is the object with a spine, it is the
one §37 names, and its cover is opening in the scene at the same moment. The
photograph and the field notes are loose sheets: they slide, they do not turn
a page. `transform-origin` sits at 12% — the bound edge.

### It was playing behind the curtain

Measured on a click into /about, before any of this was gated: the page turn
started at 209ms and ran 900, so it finished at 1109. The chapter card does
not clear until 1568.

The whole of the signature moment was over before there was anybody in the
room. Not too fast and not too slow — §19 cost this phase the same lesson with
the camera arrival, and it turns out one fix does not inoculate the next
thing built beside it.

Held at its first keyframe with `animation-play-state: paused` while the
transition is in any phase but IDLE. Not by delaying the mount: the record is
real content and belongs in the DOM, the accessibility tree and the crawled
markup from the first paint. Only its entrance waits. Verified in production:

| at | |
| --- | --- |
| 33 ms | paused, held, currentTime 0 |
| **1569 ms** | released, running, still at currentTime 0 |
| 4163 ms | finished |

1569 is the card clearing. The turn now starts on the frame the page becomes
visible and runs all 900ms of itself in view.

There is a three-second limit on the waiting, past the transition's own 2600ms
guard. Holding the arrival means holding the record at opacity 0, and "the
resting state is the visible one" is the one motion rule that should never
depend on another system staying alive. If the phase ever stalls, what is lost
is an animation nobody sees. Not hypothetical: with the browser pane
unpainted, the transition's own choreography stops advancing and the record
sat invisible for seven seconds.

### Two things the build taught

**The wrapper is not the sheet.** TornPaper rests at an angle and does it with
`transform: rotate(var(--tilt))`. Animating transform on that same element
would have replaced the rest angle — the tilt surviving every frame of the
arrival and vanishing on the last one. Two owners, one property. So a wrapper
moves and the sheet keeps its angle. Verified with the animation forced off:
wrapper `transform: none`, sheet still at −0.4°.

**Both easing tokens are the wrong shape for an object.** `--ease-cinematic`
put 26 degrees of fold at the start, 8 at 150ms and 2 at 300 — the entire turn
in the first third of a 900ms animation and six hundred milliseconds of tail
where nothing moves. It read as a flick. `--ease-weighted` is new for this:
slow to start, because a thing with mass is, and decelerating into place.

| t | before | after |
| --- | --- | --- |
| 150 ms | −8.2° | **−20.3°** |
| 300 ms | −2.5° | −11.0° |
| 450 ms | −0.7° | −5.1° |
| 750 ms | −0.0° | −0.4° |

### Checked

| | |
| --- | --- |
| replay per subject | keyed on the open object, so walking notebook → photograph → notebook plays each time |
| reduced motion | animation off, opacity 1, wrapper square, sheet still tilted, text present |
| the bench | no control to come from, so no direction: it settles rather than travels |
| production | /about 3.83 kB / 131 kB, shared bundle 104 kB, no console errors |
