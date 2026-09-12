# Handoff — Phase 4, steps 28 and 31

**Scope:** the performance pass and production build verification for THE FRONTIER,
a Next.js 15 / React 19 portfolio. Both are verification jobs: measure, report,
and fix only what is unambiguous. They are batched because they share one build.

**Read `CLAUDE.md` in the repo root first.** It carries the invariants that are
not discoverable from any single file, and every one of them has already cost
this project time once.

---

## Ground rules

1. **This is not a redesign.** Do not change the visual design, the token
   palette, the motion vocabulary, or any copy. If something looks wrong to
   you, report it; do not fix it.
2. **Report first, change second.** Land only changes that are objectively
   safe: a removed dead import, a missing cleanup, an unbounded listener.
   Anything requiring a judgment call goes in the report as a proposal with
   its measured cost.
3. **Do not add dependencies.** Not one, not a dev dependency, not a
   "lightweight" anything.
4. **Do not touch `--color-red-light` or `SurveyAnnotation`.** A separate
   session is actively fixing a contrast failure there. Editing it will
   conflict. It is a known issue; leave it alone and do not report it.
5. **Every number in your report must be measured by you**, with the command
   or probe that produced it. No estimates presented as findings.

---

## Environment

```bash
npm run dev          # do NOT run while building
npm run build        # stop dev and `rm -rf .next` first — they share .next and corrupt each other
npm run typecheck
npm run check:3d     # must pass
```

- **Never run `npm run build` while a dev server is up, and never start dev on
  a `.next` a build wrote.** They share the directory and corrupt each other;
  the symptom is `__webpack_modules__[moduleId] is not a function` on several
  routes at once, which looks like a code fault and is not. Recovery is
  `rm -rf .next` and restart.
- The repo has a **mixed LF/CRLF** working tree. Scripted edits must match the
  file's own line endings, not assume one.
- `three` / `@react-three/fiber` may only be imported inside `components/three`
  and `lib/three`. `check:3d` enforces it. `three` is ~700 kB against a 103 kB
  shared bundle, so a single stray import is a real regression.

---

## Baseline — measured at commit `c61ae43`

A clean `rm -rf .next && npm run build` produces **26/26 static pages** and:

```
Shared JS for all routes                103 kB
  chunks/1255-*.js                     46.4 kB
  chunks/4bd1b696-*.js                 54.2 kB

/                       934 B  /  108 kB      /professional      699 B  /  108 kB
/about                14.4 kB  /  126 kB      /projects         1.77 kB /  109 kB
/archive              1.06 kB  /  108 kB      /projects/[p]     3.29 kB /  110 kB
/bounties             1.54 kB  /  108 kB      /skills            952 B  /  108 kB
/contact              1.06 kB  /  108 kB      /lab/scene        4.72 kB /  151 kB
/frontier             17.1 kB  /  168 kB      /robots.txt        134 B  /  104 kB
/_not-found            377 B  /  104 kB       /sitemap.xml       134 B  /  104 kB
```

**26, not 24.** `app/sitemap.ts` and `app/robots.ts` were added in step 30,
after the first version of this brief was written. Two routes appearing is
the expected state, not a regression — and `/sitemap.xml` must list exactly
the twelve canonical routes with no `/lab` entry among them.

Runtime measurements taken at 375px viewport:

| measure | `/frontier` | `/about` |
| --- | --- | --- |
| HTML, raw | 102,137 B | — |
| HTML, gzipped | 24,514 B | 22,109 B |
| DOM nodes | 1,071 | 554 |

Other figures established and expected to hold:

- The deferred map surround chunk is **1,893 B** and must not be fetched below
  861px (`components/map/FrontierMap.tsx`).
- `/frontier` is the heaviest route by design; `/lab/*` are development
  benches and are **not** part of the shipped experience — exclude them from
  judgments about the site's weight, but confirm they still build.
- The ambient audio bed renders at **−36.2 dBFS**. It must remain inaudible
  until the control is pressed.
- `SITE_ORIGIN` in `lib/routes.ts` is a known placeholder domain. Do not
  change it and do not report it.

Treat any route that grew more than ~2% over these numbers as a finding worth
explaining.

---

## Step 28 — performance pass

Measure, then report. Specific things to check, in rough priority order:

1. **Bundle.** Compare the route table to the baseline above. Attribute any
   growth to a specific import. Confirm nothing pulled `three` or `motion`
   into the shared chunk.
2. **Animation cost.** This site animates continuously in three places: the
   scene atmosphere (dust, haze), the global light layer in
   `components/shell/TextureLayer.module.css`, and firelight/smoke in
   `components/scenes/CampArt.module.css`. Verify each is **compositor-only**
   (`transform` / `opacity`), and that nothing animates a property that
   triggers layout or paint on every frame.
   - One known and accepted exception: `components/shared/PageHeader.module.css`
     animates `letter-spacing`, which triggers layout. It is short, runs once
     per navigation, and was measured not to rewrap. Confirm, do not "fix".
3. **Layers.** Audit `will-change` usage. A permanently promoted full-viewport
   layer costs memory on low-end phones. `SceneLayer` uses it deliberately;
   `TextureLayer` deliberately does not. Flag any others.
4. **Leaks.** Every timer, listener, `AudioContext` and observer must be torn
   down. Check `components/audio/AtmosphereControl.tsx`,
   `components/transition/TransitionProvider.tsx`,
   `components/map/FrontierMap.tsx`, `components/boot/BootScreen.tsx`, and
   `components/scene/Scene.tsx`. Navigate between routes repeatedly and
   confirm listener and timer counts do not climb.
5. **Main thread.** Record a trace of a cold load of `/` and of `/frontier`.
   Report long tasks over 50ms with what caused them.
6. **Fonts and images.** Report total font weight and whether any layout shift
   is attributable to font swap. Report any image shipped larger than its
   displayed size.

---

## Step 31 — production build verification

1. `rm -rf .next && npm run build` — must complete with **24/24** and no
   warnings that are new relative to the baseline.
2. `npm run typecheck` — clean.
3. `npm run check:3d` — must print that the boundary is intact.
4. Serve the production build (`npm run start`) and load **every** route:
   `/`, `/frontier`, `/about`, `/skills`, `/projects`, `/projects/tuneit`,
   `/projects/onsight`, `/projects/bobai`, `/bounties`, `/archive`,
   `/contact`, `/professional`, and a deliberate 404.
   For each, report: HTTP status, console errors, console warnings, and any
   React hydration mismatch.
5. **Hydration is the one to be thorough about.** This site generates geometry
   from seeds and it has produced mismatches twice, both times from unrounded
   trigonometry. A mismatch may only appear on one route. Check all of them.
6. Confirm every route has a `<title>`, a meta description, and a canonical
   link.
7. Confirm the landing boot sequence runs once per session on `/` only, and
   that a direct load of any other route never shows it.

---

## Deliverable

A single markdown report:

- **Summary** — did the build pass, and is the site's performance acceptable.
- **Measurements** — the tables above, filled in with your numbers beside the
  baseline.
- **Findings** — ranked most severe first. For each: what, where
  (`file:line`), how you measured it, and what it costs a real visitor.
- **Changes made** — the diff, and why each one was safe to make unilaterally.
- **Proposals** — anything you chose not to change, with its cost and the
  trade-off, for a human to decide.

If you find nothing, say so plainly. A clean report that names what was
checked is more useful than a list of speculative micro-optimisations.
