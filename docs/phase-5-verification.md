# Phase 5 — route verification

Run against the **production build** (`npm run build` then `npm run start`) at
commit `20b3547`, after fourteen steps of 3D work that touched shared
components — `Scene`, `SceneObject`, `FrontierMap`. The question was whether
any route regressed; none did.

## Routes

All fifteen checked paths returned what they should: the twelve canonical
routes plus `/robots.txt` and `/sitemap.xml` at 200, and an invented path at
404. The sitemap still lists exactly **12 URLs with no `/lab` entry**, and
`robots.txt` still disallows `/lab/`.

## Console

Seven client-side navigations across `/about`, `/skills`, `/projects`,
`/bounties`, `/archive`, `/contact` and `/frontier` — including both routes
that mount a renderer — produced **zero errors and zero unhandled
rejections**.

One error did appear first and was chased down rather than filed: a
`ReferenceError: heightScale is not defined`, buffered from the dev session
and stamped `scheduler.development.js`. It was real when it happened — an
intermediate state served by HMR while a dependency array was being moved
between two `useMemo` calls — and absent from the build.

## What the renderer costs, and who pays

Total JavaScript transferred, measured per route:

| route | desktop | narrow (375px) |
| --- | --- | --- |
| `/skills`, `/contact` | 125 kB | — |
| `/about` | 452 kB | **144 kB** |
| `/frontier` | 450 kB | **185 kB** |

The difference is entirely the renderer, and it is fetched only where the
scene is actually shown: capable, wide, and after the page has settled.

Non-3D routes requested **no chunk over 120 kB** — three is not merely absent
from the shared bundle, it is absent from those pages altogether.

## What survived

- `/frontier` at desktop: canvas mounted **and** the navigation region intact,
  with all its marker links. The country is rendered; the map is not.
- `/frontier` at 375px: no canvas, no `data-scene-mode` element at all, and
  **no ridges or scrub in the DOM**. The vista work did not undo step 26's
  saving — `ThreeScene` never mounts there, so its fallback never loads
  `MapVista`'s chunk either.
- `/about` at 375px: scene mode `reduced`, illustrated camp present, three
  tabs still operable.

## Method note

Every figure here came from `performance.getEntriesByType("resource")` in a
production page, not from the build table. The build table says what a route
*could* load; this says what it *did*.

---

# Production build verification

The prerendered artifact, inspected directly — the questions only the built
output can answer. Run at commit `848a052`.

## The build

26/26 static pages, no warnings. `typecheck` and `check:3d` both clean.
Twenty prerendered HTML files on disk.

## Metadata

All twelve canonical routes carry a `<title>`, exactly one meta description
and exactly one canonical link. None missing, none duplicated.

## What arrives before JavaScript

This is the part worth checking after a phase that added a renderer, because
the renderer is the one thing that cannot be server-rendered.

- **`/about` prerenders the illustrated camp.** `data-scene-mode="pending"`,
  `data-layer="camp"` present, no canvas. The drawn scene is the first painted
  frame and also the no-JS one; the renderer replaces it later or never.
- **`/frontier` prerenders no surround at all** — no ridges, no scrub, no
  scene-mode element. That is step 26's `ssr: false` rather than anything step
  17 did, and the sheet, its markers and its navigation region are all there
  without it.
- **The About tabs need JavaScript.** Only one `role="tabpanel"` is rendered,
  so a visitor without JS sees the notebook's record and cannot reach the
  other two. That is within the routing contract, which promises the
  professional view as the JavaScript-free path rather than promising the
  camp — and `/professional` delivers: education, all three projects, both
  headline metrics, contact, 25 links, no tabs. The About page also carries
  its education content in the default panel regardless.

## The no-flash guarantee

Still holds, and it is three separate things that each have to be true:

- the boot layer is server-rendered on **every** page, so it is in the first
  painted frame rather than built after one;
- `html:not([data-boot=play]):not([data-boot=short]) [data-boot-layer]{display:none!important}`
  ships, so it is invisible unless the stamp says otherwise;
- the stamp script short-circuits on `location.pathname !== "/"`, so no other
  route can ever raise it.

## Hydration

Zero console errors and zero uncaught errors on `/`, `/professional`,
`/projects/onsight` and a 404, each measured on a fresh load with a listener
installed before hydration settled. Combined with step 18's seven routes, that
is every canonical route plus the 404.

The 404 renders its heading and points at `/frontier`, as the contract says it
should.
