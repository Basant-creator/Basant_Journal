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
| 22 | 3D → DOM bridge | done — re-measured after the lens change: gaps 3.1 / 2.8 / 3.0 |
| 23 | Notebook → Paper | record wired; §37's cinematic open not built |
| 24 | Map → Camp | done and measured |
| 25 | Camp → Map | done and measured |
| 26 | Mobile quality tier | done — phones draw at LOW; the connection gate later proved too sharp, see 28 |
| 27 | WebGL fallback | done — and it was rendering at zero height |
| 28 | Resource disposal | done — the disposal code ran and reached nothing |
| 29 | Performance profiling | outstanding, with §38's overlay |
| 30 | Accessibility / reduced motion | done and audited |
| 31 | Production verification | outstanding |

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
draw a campfire. So the probe now reads `saveData` and `effectiveType`, and
either a visitor asking for less data or a link at 3G or below returns
fallback. Absent is not slow: most browsers do not implement the API, and
guessing badly there costs someone the whole scene.

| case | tier |
| --- | --- |
| desktop, capable | high |
| laptop, 4 cores | medium |
| phone on 4G | **low** |
| tablet, 2GB | low |
| old GPU, 2048 max texture | low |
| phone with Save-Data on | fallback |
| phone on 3G or worse | fallback |
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
