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
| 26 | Mobile quality tier | illustrated row shipped; 3D-on-mobile is open |
| 27 | WebGL fallback | next |
| 28 | Resource disposal | context release done; §33 sweep outstanding |
| 29 | Performance profiling | outstanding, with §38's overlay |
| 30 | Accessibility / reduced motion | done and audited |
| 31 | Production verification | outstanding |

## The one open decision

§31 lists **LOW — mobile / weaker GPU** as a rendering tier, which reads as
phones getting a cheap 3D camp. The shipped behaviour is the opposite: the
860px cut in `capability.ts` sends phones to the illustrated camp, on a budget
argument written down there — the download, the sustained draw and the battery
are all worse trades on a device where the composed 2D scene reads just as
well. §21 and §41 can be read either way ("falls back gracefully", "does not
receive desktop-level rendering unnecessarily").

The tier machinery is built so that either answer is a one-line policy change
in `detectSceneCapability`. The current answer is the shipped one, and it is
flagged rather than silently reversed.

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
