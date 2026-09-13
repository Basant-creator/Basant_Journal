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
| 04 | High-fidelity lighting | built at the old target — to upgrade |
| 05 | Sky / dusk environment | built at the old target — to upgrade |
| 06 | Terrain | built at the old target — to upgrade |
| 07 | Vegetation, instanced | instanced; wants variants |
| 08 | Camp structure | built at the old target — to upgrade |
| 09 | Hero props | built at the old target — to upgrade |
| 10 | Campfire | built at the old target — to upgrade |
| 11 | Smoke / atmosphere | built at the old target — to upgrade |
| 12 | Notebook | geometry and response done; fidelity to upgrade |
| 13 | Survey map | route and highlight done; §16 detail to upgrade |
| 14 | Photograph | real print, colour-matrix treatment, anchored crop |
| 15 | Lantern | built at the old target — to upgrade |
| 16 | Cinematic camera | framing set; focal length and depth to tune |
| 17 | Arrival sequence | 1900ms, smootherstep, plays after the curtain |
| 18–21 | Object interactions | done — lift, warmth, route accent |
| 22 | 3D → DOM bridge | done — position and width, verified to 0.018 |
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
