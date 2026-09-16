# Phase 8 — final audit

The state of THE FRONTIER at the convergence pass, recorded so the next person
to open this repository does not have to rediscover it. Everything below was
measured or exercised, not inferred. Where something could not be verified in
this environment, it says so rather than claiming a pass.

Measured against commit `df27cb7` (the Phase 7 audit), on a cold production
build.

---

## Working systems

These were exercised and behaved correctly.

**Routing.** All twelve routes serve 200 on direct load in both development and
a production build. `/nope` and `/projects/nonexistent` both 404 — the dynamic
segment rejects an unknown slug rather than rendering an empty record.

**Route transitions.** One owner (`TransitionProvider`), five profiles, and the
three invariants in its own doc comment hold under stress. See the matrix and
the stress log below.

**Boot / transition separation.** `data-boot` is stamped pre-paint by a script
in `<head>`, on `/` only. Four global rules in `globals.css` implement "no flash
of Home" against that attribute, and the application is hidden rather than
unmounted so Home is uncovered rather than built. The boot layer never appeared
during any route navigation in testing.

**Camp lifecycle.** Four full mount/unmount cycles in production: canvas count
0 when away, exactly 1 at Camp, `data-scene-mode="ready"` every time, zero
console output. No context leak and no eviction — the failure mode an earlier
phase hit at sixteen contexts.

**The 3D boundary.** `npm run check:3d` passes. More usefully, no route's
prerendered HTML references any chunk containing `WebGLRenderer` — not even
`/about`. The renderer is fetched after hydration, behind the capability check.

**Reduced motion.** 38 stylesheets carry a `prefers-reduced-motion` block, and
there are zero stylesheets that animate without one. Every JS decision point
guards: map camera returns `RESTING_CAMERA`, `JournalOpening` does not play,
`RecordEntry`, `PaperReveal`, `Scene` parallax, `useSheetArrival`, and
`capability.ts` drops Camp to the illustrated tier entirely.

**Accessibility basics.** Exactly one `h1` per route, no skipped heading levels
anywhere. Every `<nav>` is labelled. No `<img>` without `alt`. Zero interactive
elements under 44px on a coarse pointer across the routes tested.

**Security.** No secrets, no API keys, no environment variables beyond
`NODE_ENV` and the two origin variables. `dangerouslySetInnerHTML` appears
twice, both for the pre-paint stamp scripts, both built from module constants
with no user input reaching them.

**Content integrity.** Every unresolved value is still unresolved and still
rendered as such. No number on the site is absent from `content/portfolio.json`.

---

## Route matrix

Legend: **✓** exercised and correct · **✓¹** verified structurally (the preview
pane cannot paint this reliably) · **✓²** logic verified, see Reduced motion below.

| Route | Direct load | Transition | Back | Forward | Mobile | Reduced motion |
|---|---|---|---|---|---|---|
| `/` | ✓ | ✓ (boot, once per session) | ✓ | ✓ | ✓ | ✓² |
| `/frontier` | ✓ | ✓ WORLD_TO_SCENE | ✓ | ✓ | ✓ | ✓² |
| `/about` | ✓ | ✓ WORLD_TO_SCENE | ✓ | ✓ | ✓ | ✓² |
| `/projects` | ✓ | ✓ WORLD_TO_PAPER | ✓ | ✓ | ✓ | ✓² |
| `/projects/tuneit` | ✓ | ✓ PAPER_TO_RECORD | ✓ | ✓ | ✓ | ✓² |
| `/projects/onsight` | ✓ | ✓ RECORD_TO_RECORD | ✓ | ✓ | ✓ | ✓² |
| `/projects/bobai` | ✓ | ✓ RECORD_TO_RECORD | ✓ | ✓ | ✓¹ | ✓² |
| `/professional` | ✓ | ✓ ANY_TO_PROFESSIONAL | ✓ | ✓ | ✓ | ✓² |
| `/skills` | ✓ | ✓ WORLD_TO_SCENE | ✓ | ✓ | ✓ | ✓² |
| `/bounties` | ✓ | ✓ WORLD_TO_SCENE | ✓ | ✓ | ✓ | ✓² |
| `/archive` | ✓ | ✓ WORLD_TO_SCENE | ✓ | ✓ | ✓ | ✓² |
| `/contact` | ✓ | ✓ WORLD_TO_SCENE | ✓ | ✓ | ✓ | ✓² |
| `/nope` | ✓ 404 | n/a | ✓ | ✓ | ✓ | ✓ |

Measured timings, development build:

| Move | Sequence | Total |
|---|---|---|
| Announced navigation | EXIT → LOADER → CHAPTER → ENTER → IDLE | 1754 ms |
| Browser Back | CHAPTER → ENTER → IDLE (no loader, short dwell) | 1055 ms |
| Record → record | EXIT → ENTER → IDLE (page turn, no chapter) | 544 ms |

---

## Transition stress log

Every case ended at the correct route, with `phase: IDLE`, zero curtain
elements in the DOM, `body` overflow restored, and the app shell visible.

| Case | Result |
|---|---|
| Five nav clicks across five destinations, 80 ms apart | Landed on the fifth. Clean. |
| Click Camp, click Gear 120 ms later | Router went `/frontier → /skills` directly; chapter shown was the Workshop, never Camp's. |
| Back fired 150 ms into a transition | Clean. |
| Forward fired 150 ms into a transition | Clean. |
| Same destination clicked six times, 60 ms apart | Clean. |
| Nav clicked during the chapter card | Clean; newest won. |
| Left Camp 250 ms into the 3D load | Landed on `/projects` with **0 canvases** left behind. |
| Navigated from inside the open mobile drawer | Drawer closed, `body` overflow restored from `hidden` to `visible`. |

The one place body scroll is deliberately locked is the mobile drawer, and it
restores on both Escape and navigation.

---

## Known issues

**Ad-hoc `rgba()` in components — 111 occurrences across 26 stylesheets.**
`CLAUDE.md` non-negotiable #4 says colour is never raw. The Phase 7 additions
were converted to `color-mix` on tokens; the remaining 111 are pre-existing and
were left deliberately. Converting them is a large visual-risk diff for no
behavioural gain, and it should be done as its own pass with screenshots, not
folded into a convergence phase.

**Raw hex with no exact token — 6 occurrences.** `#4d423a` in the professional
stylesheet, `#060505` and `#e7d9bc` in `BootScreen`, and three composed
gradients (`MobileTrail`, the survey shell, Paper's `PHOTOGRAPH` mount). Each
would need a new token to resolve properly.

**`design/tokens.css` has drifted from `app/globals.css`.** 192 distinct custom
properties against 230, and the reference file carries none of the cursor
tokens. `globals.css` is the runtime copy and is correct; the reference is
stale. `CLAUDE.md` states 193, which is off by one against measurement.

**The Open Graph card renders in a fallback sans.** `next/og` does not inherit
`next/font`, so the share image is drawn in a system face rather than Rye or
IM Fell. The card is clean and legible — it simply is not in the site's voice.
Fixing it means vendoring a `.ttf` into the repository and adding a font-loading
path to the image route; judged not worth the fragility for the gain. See
`launch-readiness.md`.

**CSS preload warnings on `/` only.** Four `link[rel=preload]` stylesheets are
reported unused a few seconds after load. They are the stylesheets of the routes
the landing page prefetches. This is Next's App Router prefetching working as
intended, and the warning is a browser heuristic, not a fault. Every other route
tested — including `/professional` and `/about` with the full 3D scene —
produces a **completely silent** production console.

**`THREE.Clock` deprecation.** Emitted by `@react-three/fiber` internals, not by
this repository. Absent from the production build. Not actionable here.

---

## Technical debt

- `components/scene/ChapterCard.tsx` and `LocationTitle.tsx` are rendered only
  by `/lab` benches. They are part of the design system rather than dead code,
  but nothing in the shipped site uses them, and a reader may reasonably expect
  `ChapterCard` to be what the routes use. It is not — `RouteCurtain` is.
- The eleven `/lab` routes prerender into the production output. They are
  `robots`-disallowed and absent from the sitemap, with the reasoning recorded
  in both files, but they remain reachable by direct URL.

---

## Visual inconsistencies

None outstanding at the time of writing. The territory routes share one type
scale, one paper treatment, one eyebrow/title pattern and one red budget;
`/professional` is deliberately different because it inverts the layer model,
which is the design intent rather than a drift.

---

## Deployment risks

**Resolved this phase.** `SITE_ORIGIN` no longer hardcodes a placeholder
domain. It resolves from `NEXT_PUBLIC_SITE_ORIGIN`, then Vercel's
`VERCEL_PROJECT_PRODUCTION_URL`, then localhost. Verified end to end: a build
with the Vercel variable set produced `https://basant-journal.vercel.app` in
`robots.txt`, the sitemap and every canonical tag.

**Remaining.** A production build that finds neither variable falls back to
localhost and prints a warning server-side. On Vercel this cannot happen —
the platform supplies the variable — but a build on any other host must set
`NEXT_PUBLIC_SITE_ORIGIN` or ship wrong canonical URLs.

---

## Unresolved decisions

These are unresolved **on purpose**, under non-negotiable #1: an invented value
is worse than a missing one.

| Value | State | Rendered as |
|---|---|---|
| Project repository / demo URLs (all three) | `null`, `linksStatus: "unresolved"` | "Repository and demo links are not yet recorded for this system." |
| Résumé PDF | absent from `public/`, `resumeStatus: "unresolved"` | Download button hidden; professional view offered instead |
| Two certificate files | `null`, `certificateStatus: "unresolved"` | "Certificate not yet filed" |
| Certification issuers (two) | `null` | Issuer line omitted |

Each has a working guard. Dropping the file in and flipping the status is the
whole of the change needed — no code edit.

---

## What could not be verified here

Stated plainly because a claimed pass is worse than a known gap.

- **`prefers-reduced-motion` at the media-query level.** The preview pane
  cannot emulate it. The CSS was audited statically (38 guarded stylesheets,
  zero unguarded animating ones) and the JavaScript paths were exercised at
  runtime by patching `window.matchMedia` — under which a route transition
  still announced its chapter, still landed correctly, and never blocked
  navigation. The media query itself is unexercised.
- **Scrolled composition.** The pane composites scrolled screenshots blank and
  freezes CSS transitions when it is not painting, so anything below the fold
  — the blueprint record sheet in particular — is verified structurally and by
  computed style rather than by eye.
- **Real network conditions (§25).** Throttling is not available here. Loading
  behaviour was reasoned about from the code (deferred chunks, `priority` on
  the portrait, `display: swap` on all five faces) rather than measured.
- **Real mobile hardware.** Viewport and touch-pointer emulation only.
