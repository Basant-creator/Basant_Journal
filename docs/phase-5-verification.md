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
