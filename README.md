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

## The four-layer model

Every visual decision in this repository resolves against one model. If a
component does not belong to exactly one of these layers, it is wrong.

| Layer | What it is | Where it lives |
|---|---|---|
| **THE DARK** | Atmosphere, shell, navigation. Ink ground, vignette, grain. | `app/globals.css`, `components/shell`, `components/navigation` |
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
  page.tsx                the landing — arrival, two doors, nothing else
  (survey)/
    layout.tsx            the shell: persistent navigation
    frontier/             the interactive survey map
    professional/         the recruiter route (layer model inverted)
    [location]/           the seven locations, data-driven
  opengraph-image.tsx     share card, drawn from the same tokens

components/
  map/          FrontierMap, LocationNode, Trail, MapLayer, MapLegend,
                MapCompass, MobileTrail, symbols
  terrain/      TerrainLayer — the sheet, in draughtsman's layer order
  paper/        PaperSurface — the reusable document surface
  annotations/  SurveyAnnotation — THE HAND in the DOM
  navigation/   Navigation, SkipLink
  metrics/      Metric
  shell/        TextureLayer
  shared/       Button

lib/
  content/      types + the single read point for portfolio.json
  map/          rng, geometry, terrain, locations (routes and camera maths)
  motion/       entry choreography, shared Motion transitions

content/
  portfolio.json          the only source of facts

design/tokens.css         Phase 1 token reference (globals.css is the runtime copy)
docs/                     design direction, visual spec, this phase's notes
```

---

## Three decisions worth knowing

**The map is generated, not drawn.** `lib/map/terrain.ts` emits every ridge,
contour, hachure, river bank and stipple mark from seeded generators
(`lib/map/rng.ts`). Nothing is a hand-authored `d` string. That keeps the
composition re-tunable by changing a number, gives the linework its
irregularity for free, and — because the seed is fixed — renders byte-identical
on the server and the client.

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

## Accessibility contract

- The map is one composite widget: a single tab stop, arrow keys along the
  trail, Home/End, Escape to leave.
- `MapLegend` is the non-spatial route through the same seven locations — a
  plain list of links, and simultaneously the sheet's legend.
- Every marker state differs by ring weight, fill and label plate, not colour
  alone. Labels are legible at rest; only the supporting note is on hover, and
  that note is duplicated in the legend.
- Focus rings are surface-scoped: paper-light on the dark, ink on paper.
- Touch targets are ≥44px, independent of the drawn marker size.
- `prefers-reduced-motion` collapses every duration and removes the camera; the
  composition still has to read as deliberate with it all switched off.
