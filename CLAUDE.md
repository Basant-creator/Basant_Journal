# The title cards — working notes

A personal portfolio for **Basant Bhushan** (3rd-year B.Tech CSE, Lovely
Professional University). Next.js 15 App Router, React 19, TypeScript, CSS
Modules. No other runtime dependencies.

The site is **the title cards**: a sixties western's opening titles, one
full-screen card at a time. The genre, never a copy of any film or game.
`README.md` has the site map and structure; this file is the short list of
rules that are not discoverable by reading any single file.

(It replaced an earlier "surveyor's field record" site in November 2026. That
site's code is gone from the tree and lives only in git history; its
addresses redirect into the cards from `next.config.ts`.)

---

## Non-negotiables

1. **Never invent project content.** Every fact, figure, date and URL comes from
   `content/portfolio.json`. Unknown values are `null` with a matching
   `*Status: "unresolved"` marker — leave them unresolved rather than filling
   them in (Strata's `lessons` is one: the owner's to write). An invented
   metric is worse than a missing one. Labels the cards add ("Featuring",
   "Send Word") are copy, not facts, and the owner reviews them.
2. **No copyrighted assets.** No film stills, logos or reproduced title
   sequences. Pictures are public domain or openly licensed, credited on the
   last card and in `components/cards/art/credits.ts`.
3. **Route strings are never inline.** Everything resolves through
   `lib/routes.ts` (`routes`, `workRoute`, `cardRoute`). Card ids live in
   `lib/cards/keys.ts`, which `next.config.ts` can import.
4. **Colour is never raw.** No hex in a component's stylesheet: every colour is
   a `--titles-*` token in `app/globals.css`, mixed with `color-mix()` where it
   needs strength. `npm run check:tokens` enforces both this and that no
   `var(--x)` resolves to nothing. The only hex outside globals is where a
   stylesheet cannot reach: the share card, the global error page, the icon,
   the viewport's theme colour.

## Architecture

- **One source of facts.** `lib/content/portfolio.ts` is the only reader of the
  JSON. `lib/cards/catalog.ts` is the cards' reading of it: the key projects in
  deal order (`KEY_CASES`), finished projects and work in progress alike as
  `CaseFile`s (Strata's lives on its `ongoing` entry as `caseFile`), and the
  toolbox credits (`CAST`), which credit only projects on the deck.
- **The deck owns its motion.** `components/cards/Deck.tsx` is the one place a
  card changes: which card is up, every cut, the keys, the wheel, swipes, the
  address. A card that arrives gets `data-in`, which restarts its letters and
  lines (each animated part has two keyframe copies, `…0` at load and `…1` on
  arrival, so changing the name restarts it). Pages do not add their own
  arrival effects.
- **Cuts are compositor-only.** Each piece of a wipe is one animation (on,
  hold, off) on `transform`/`opacity`; the card is swapped under the cover by a
  timer. Push and zoom move the cards themselves, the old one kept visible with
  `data-leaving`. The wipe layer is appended to `document.body`, outside any
  stacking context.
- **Stillness is the cards' own.** `prefers-reduced-motion`, or a browser
  compositing in software (`lib/cards/gpu.ts` → `html[data-titles-still]`),
  gives plain cuts and no loops. Every loop needs both guards, saying the same
  thing.
- **The other cards are inert.** Only the card on screen is reachable by focus
  and assistive technology; each cut is announced in a live region. The skip
  link's `#main` focuses the card on screen (Deck reads it as that, not a cut).

## Traps that have already cost time

- **Never read layout or style in the key press.** `getComputedStyle` at the
  moment of a cut forced a full restyle inside the handler: 10–15ms on a slow
  phone, every cut. Read anything a cut needs once, at mount.
- **Frame drops in headless traces are not all real.** An eased animation's
  tail moves less than a pixel per frame, nothing is redrawn, and Chrome's
  `STATE_DROPPED` counts it anyway (a lone square with ease-out "drops" half
  its frames). Judge by work instead: main-thread tasks over 16ms, GPU tasks
  over 8ms.
- **Round every generated coordinate.** Seeded output (`lib/cards/rng.ts`) must
  be rounded — `Math.round(n * 100) / 100` — or Node and the browser differ in
  the 15th decimal and React reports a hydration mismatch.
- **An animation inside an SVG repaints all of it.** Moving parts are HTML
  boxes or a whole `<svg>` a CSS transform moves (the cylinder turns as one
  element; the tumbleweed rolls in three nested boxes).
- **A CSS `transform` silently replaces an SVG `transform` attribute.** Pick one.
- **Pictures are baked, never filtered or blended live.** A filter or a blend
  on a card's picture repaints it whenever the card is shown. Silhouettes are
  black-on-clear PNGs from `scripts/titles-silhouette.py`; sources are in the
  git-ignored `assets/titles-source/` (the painting is fetched from Wikimedia
  Commons when missing). Bake wide enough for 2× screens, and give `<Image>`
  a `sizes` that matches its cover-fitted width, or phones get a small copy
  stretched three times.
- **`opacity: 0` hides a thing from the eye and from nothing else.** An
  invisible element still takes clicks. Test hit areas with
  `elementFromPoint`, never by looking.
- **Never read storage during render.** State render depends on goes through
  `useSyncExternalStore` with an empty server snapshot.
- **StrictMode double-invokes effects.** An effect that reads state it wrote
  itself will bail on the second run. Use a ref for the decision.
- **In CSS Modules, `:global(html:has(.x))` does not hash `.x`.** Write
  `:global(html):has(.x)`.

## Motion rules

- **Never delay route navigation for an animation.** The case-file link lays
  its bars while the router goes; the case file arrives under the same bars.
- **The resting state is the visible one.** Animate *from* an offset toward
  normal with `animation-fill-mode: both`, so a browser that never runs the
  animation shows finished content. Decoration that should not be seen at
  rest (dust, the muzzle flash) rests at `opacity: 0` and plays from there.
- **Honour `prefers-reduced-motion` at the source.** The blanket in
  `app/globals.css` (durations and delays to nothing, one iteration) is a
  backstop, not the mechanism.
- **Replay per subject.** A card's title slams every time it arrives, not
  once per visit.

## Commands

```
npm run dev            # do NOT run concurrently with build
npm run build          # stop dev and delete .next first — they clobber each other
npm run typecheck
npm run check:tokens   # unresolved var(--x); raw colours in components
python scripts/titles-silhouette.py   # re-bake the silhouettes
```

## Environment notes

- **A hidden browser pane stops the render loop**: `requestAnimationFrame` never
  fires and animations are not sampled, so timings read as dead. Take a
  screenshot to make the pane paint before believing a zero, or test in
  headless Chrome (puppeteer-core is a dev dependency for that).
- **The pane does not hold OS focus**, so `element.focus()` moves
  `document.activeElement` and fires no focus event. Test focus by dispatching
  a bubbling `focusin`.
- Viewport emulation in the pane does **not** reach `matchMedia`; test
  breakpoints by loading fresh at the width.
- `next dev` and `next build` share `.next` and corrupt each other. Stop the dev
  server and remove `.next` before building.
- **`pkill -f "next start"` does not kill it in Git Bash here.** A stale server
  keeps its port and serves HTML from its own older build, referencing CSS
  hashes the current build no longer contains — pages render unstyled and look
  like your bug. Kill it with PowerShell:
  `Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
- Google Fonts fetches during `next build` fail now and then (`ETIMEDOUT`, or a
  `next/font` "Cannot read properties of null"); retry the build.
