# THE FRONTIER

A personal portfolio for **Basant Bhushan**, built as a surveyor's record of
territory still being mapped.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

---

## The five-layer model

Every visual decision in this repository resolves against one model. If a
component does not belong to exactly one of these layers, it is wrong.

| Layer | What it is | Where it lives |
|---|---|---|
| **THE DARK** | Atmosphere, shell, navigation. Ink ground, vignette, grain. | `app/globals.css`, `components/shell`, `components/navigation` |
| **THE SCENE** | Places. Depth bands, air, camera, the world an artifact sits in. | `components/scene`, `lib/world`, the scene layers in `components/map` |
| **THE TERRAIN** | The survey sheet: parchment field, ink cartography, routes, locations. | `lib/map`, `components/terrain`, `components/map` |
| **THE PAPER** | Documents and reading surfaces. | `components/paper` |
| **THE HAND** | Red ink. Measurement, annotation, human intervention. ~3% of any view. | `components/annotations`, the map's annotation layer |

Three rules follow, and they are enforceable:

- Long-form content never floats on the dark without a paper surface.
- Red is THE HAND only — never a background field, never a generic accent on
  every button.
- Handwriting annotates; it never carries information.

---

## Structure

```
app/
  layout.tsx              fonts, metadata, pre-paint entry stamp, texture layer
  page.tsx                /            the landing — arrival, two doors
  (survey)/
    layout.tsx            the shell: persistent navigation
    frontier/             /frontier    the interactive survey map
    projects/             /projects    the Journal index
      [project]/          /projects/*  the three field records
    about/                /about       Camp
    skills/               /skills      Gear
    bounties/             /bounties    Bounties
    archive/              /archive     Archive
    contact/              /contact     Trail End
    professional/         /professional (layer model inverted)
  opengraph-image.tsx     share card, drawn from the same tokens

components/
  map/          FrontierMap, LocationNode, Trail, MapLayer, MapLegend,
                MapCompass, MobileTrail, symbols
  journal/      RecordNav — section rail and scroll spy for a field record
  terrain/      TerrainLayer — the sheet, in draughtsman's layer order
  paper/        PaperSurface — the reusable document surface
  annotations/  SurveyAnnotation — THE HAND in the DOM
  navigation/   Navigation, SkipLink
  metrics/      Metric
  shell/        TextureLayer
  shared/       Button, PageHeader, OnwardNav, Territory styles

lib/
  routes.ts     the single definition of where things are
  content/      types + the single read point for portfolio.json
  map/          rng, geometry, terrain, locations, directional traversal
  motion/       entry choreography, shared Motion transitions

content/
  portfolio.json          the only source of facts

design/tokens.css         Phase 1 token reference (globals.css is the runtime copy)
docs/                     design direction, visual spec, phase notes,
                          routing & interaction contract
```

---

## Four decisions worth knowing

**The map is generated, not drawn.** `lib/map/terrain.ts` emits every ridge,
contour, hachure, river bank and stipple mark from seeded generators
(`lib/map/rng.ts`). Nothing is a hand-authored `d` string. That keeps the
composition re-tunable by changing a number, gives the linework its
irregularity for free, and — because the seed is fixed — renders byte-identical
on the server and the client.

**The map is an object in a place, not a panel.** `/frontier` renders the same
map engine it always did — same SVG, same camera, same markers, same keys — set
into a frame of world: ridgelines receding through haze above its top edge,
near scrub crossing its bottom one, and the whole thing drifting a few pixels
under the pointer. The environment moves; the interactive sheet does not,
because parallax on a control makes the thing you are aiming at drift away from
you. The margins are stated twice — `SHEET_INSET` in `lib/world/vista.ts` and
the padding in `FrontierMap.module.css` — and they have to agree, or the
horizon stops landing on the sheet's edge.

**Route strings live in one place.** `lib/routes.ts` holds the map, and the
content model carries each location's and project's own canonical `route`. No
component writes a URL inline, so a route can be changed without drift.

**Content lives in one file.** `content/portfolio.json` is read by the creative
renderer and the professional renderer alike. A project added once appears
correctly in both. Unknown values are `null` beside a `*Status: "unresolved"`
marker, so missing data is visible in the type system rather than invented.

**The entry sequence is CSS; the interaction is Motion.** A pre-paint inline
script stamps `data-entry` on `<html>` (see `lib/motion/entry.ts`), and the
choreography hangs off that attribute. Two consequences: there is never a frame
of the finished map before it rewinds, and if JavaScript never runs, nothing is
left at `opacity: 0` — the document renders complete. Motion handles the camera,
where its interruptibility earns its keep.

---

## Navigation rules

- Every destination has a stable URL and works as a direct link, with no prior
  navigation required.
- Map interaction — hover, focus, camera, the engaged marker — never reaches
  the URL and never creates a history entry. `/frontier` is the only map URL.
- Navigation is never delayed by an animation. Markers are plain links; the
  camera starts on pointer-down and plays alongside the route change.
- Following the trail is a *passage*: the map plays Camp to Journal while a
  sheet of paper is laid over the view, and the arriving page tears it open.
  The wipe lives in the survey layout because that is the only thing that
  survives the route change. It never delays, gates or traps anything — see
  [docs/routing-contract.md](docs/routing-contract.md) §6.
- A location whose page does not exist stays visible and focusable but goes
  nowhere: `status: "surveying"` in the content model, no fake URL.
- The record sequence does not wrap. TuneIt → OnSight → BobAI → Journal.
- Every page ends in a way onward, and the way out of a field record is the
  map. See [docs/routing-contract.md](docs/routing-contract.md).

## Accessibility contract

- The map is one composite widget: a single tab stop, arrow keys (and WASD)
  moving to the nearest location in that direction, Home/End for trail order,
  Escape to leave.
- The mobile drawer is a real dialog: background interaction disabled, focus
  trapped, Escape closes and returns focus to the button, and it never survives
  a navigation.
- `MapLegend` is the non-spatial route through the same six locations — a
  plain list of links, and simultaneously the sheet's legend.
- Every marker state differs by ring weight, fill and label plate, not colour
  alone. Labels are legible at rest; only the supporting note is on hover, and
  that note is duplicated in the legend.
- Focus rings are surface-scoped: paper-light on the dark, ink on paper.
- Touch targets are ≥44px, independent of the drawn marker size.
- `prefers-reduced-motion` collapses every duration and removes the camera; the
  composition still has to read as deliberate with it all switched off.
