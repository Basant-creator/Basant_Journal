# THE FRONTIER — working notes

A cinematic developer portfolio for **Basant Bhushan** (3rd-year B.Tech CSE, Lovely
Professional University). Next.js 15 App Router, React 19, TypeScript, CSS Modules.

The aesthetic is a **surveyor's field record** — a frontier *inspired* by the
western genre, never a copy of any game. Read `README.md` for the design system
and `docs/design-direction.md` for the intent. This file is the short list of
rules that are not discoverable by reading any single file.

---

## Non-negotiables

1. **Never invent project content.** Every fact, figure, date and URL comes from
   `content/portfolio.json`. Unknown values are `null` with a matching
   `*Status: "unresolved"` marker — leave them unresolved rather than filling
   them in. An invented metric is worse than a missing one.
2. **No copyrighted assets.** No game logos, no ripped models, no reproduced
   loading animations or iconography. The vocabulary is the genre, not any
   product inside it.
3. **Route strings are never inline.** Everything resolves through `lib/routes.ts`
   or the content model's own `route` field.
4. **Colour is never raw.** No hex, no ad-hoc `rgba()` in a component. Everything
   comes from `design/tokens.css` (254 tokens).

## The five layers

Every visual decision belongs to exactly one layer. Mixing them is the fastest
way to make this look like a generic dark portfolio.

| Layer | Owns | Lives in |
| --- | --- | --- |
| THE DARK | Atmosphere, shell, navigation | `app/globals.css`, `components/shell`, `components/navigation` |
| THE SCENE | Places, depth bands, air | `components/scene` (engine), `components/scenes` (places), `lib/world` |
| THE TERRAIN | The survey sheet, cartography | `lib/map`, `components/terrain`, `components/map` |
| THE PAPER | Documents and reading surfaces | `components/paper`, `components/record` |
| THE HAND | Red ink: annotation, measurement | `components/annotations` |

**Red is THE HAND only** — never a background field, never a generic accent.
Roughly 3% of any view. (The layer comment at the top of `design/tokens.css`
predates SCENE and TERRAIN and lists only three; README is authoritative.)

## Architecture invariants

- **One owner per behaviour.** Route-entry choreography is owned solely by
  `components/transition/TransitionProvider.tsx`, mounted in the root layout.
  If a page needs different arrival behaviour, register it in
  `lib/transition/chapters.ts` — do **not** add a `useEffect` to the page.
  (This exact mistake produced the chapter bug fixed in Phase 5.1; see
  `docs/phase-5.1-transition-notes.md`.)
- **Boot ≠ transition.** The boot sequence (`lib/boot/boot.ts`) runs once, on
  `/` only, before first paint. Route transitions are a separate system. Never
  conflate them; the boot loader must never reappear on navigation.
- **The 3D boundary.** `three` and `@react-three/fiber` may be imported *only*
  inside `components/three` and `lib/three`. Measured: ~880 kB of renderer
  against a 104 kB shared bundle. Enforced by `npm run check:3d` — run it
  before every commit that touches imports. `components/three/README.md` is
  the full contract and is kept current; read it before changing anything in
  that folder.
- **Content is read, never duplicated.** Both the exploration renderer and the
  professional renderer read the same JSON.

## Traps that have already cost time

- **Round every generated coordinate.** Seeded output (`lib/map/rng.ts`,
  `createRng` / `seedFrom`) must be rounded — `Math.round(n * 100) / 100` — or
  Node and the browser differ in the 15th decimal and React reports a hydration
  mismatch. This has bitten three separate components.
- **SVG `filter` lengths are user units, not screen pixels.** In a 1600-wide
  viewBox rendered at ~700 px, `blur(1.1px)` is half a real pixel and looks
  like nothing. Scale to the viewBox.
- **A CSS `transform` silently replaces an SVG `transform` attribute.** Pick one.
- **`role="img"` makes an element a leaf** in the accessibility tree — children
  become invisible to assistive tech. Don't put a `label` on a container whose
  children are interactive.
- **StrictMode double-invokes effects.** An effect that reads state it wrote
  itself (a "seen" flag) will bail on the second run. Use a ref for the decision
  and hang cleanup off state, not mount.
- **Exact complementary clip paths leave a hairline.** Both halves anti-alias
  against the shared boundary; overlap by ~0.0025.
- **Anything drawn on a GPU has its own trap list.** The short version:
  damping must be frame-rate independent (`1 - exp(-lambda * dt)`, never a
  fixed fraction); nothing is allocated per frame; releasing a renderer needs
  `forceContextLoss()` and not just `dispose()`, deferred one task past
  StrictMode's effect replay; and whatever a scene writes onto the page must
  be cleared when it unmounts. The reasons are in
  `components/three/README.md`.
- **Derive text colour with `color-mix(in srgb, var(--paper-ink) N%, transparent)`**
  so a stock variant (e.g. cyanotype) inverts correctly instead of going
  invisible. Check contrast on `BLUEPRINT` specifically — it is dark-on-dark.

## Motion rules

- **Never delay route navigation for an animation.** The router changes when it
  changes; choreography plays over a page that is already interactive.
- **The resting state is the visible one.** Animate *from* an offset toward
  normal with `animation-fill-mode: both`, so a browser that never runs the
  animation shows finished content, not empty content.
- **Honour `prefers-reduced-motion` at the source**, not with a blanket
  override. Reduced motion means a still composition, not a broken one.
- **Replay per subject, not once per session.** Keying arrival on a session flag
  means walking between sibling records shows nothing.

## Commands

```
npm run dev          # do NOT run concurrently with build
npm run build        # stop dev and delete .next first — they clobber each other
npm run typecheck
npm run check:3d     # must pass before commit
```

## Environment notes

- **A hidden browser pane stops the render loop**, and every 3D measurement
  taken while it is hidden reads as a dead scene: zero frames, a canvas left
  at its default 300x150, no projected positions. That is correct behaviour
  being mismeasured, not a bug — take a screenshot to make the pane paint
  before believing a zero. The same applies to CSS scroll-driven animations,
  which are never sampled while it is hidden, and to `requestAnimationFrame`,
  which simply never fires.
- **The pane does not hold OS focus**, so `element.focus()` moves
  `document.activeElement` and fires no focus event at all — React’s
  `onFocus` never runs and focus-driven behaviour reads as dead code.
  `document.hasFocus()` returns false and is the tell. Test focus by
  dispatching a bubbling `focusin`, and treat a silent `.focus()` as
  unmeasured rather than as broken.
- Viewport emulation in the pane does **not** reach `matchMedia`: no `change`
  events fire and `innerWidth` can stay stale. Breakpoint behaviour can only
  be tested by loading fresh at the width.
- The in-app browser pane is unreliable here: scrolled screenshots composite
  blank and CSS transitions freeze when the pane isn't painting, so
  `getComputedStyle` returns stuck intermediate values. **Verify structurally
  via the DOM**, and say plainly when a visual could not be confirmed by eye.
- `next dev` and `next build` share `.next` and corrupt each other. Stop the dev
  server and remove `.next` before building.
- **`pkill -f "next start"` does not kill it in Git Bash here.** A stale server
  keeps port 3000 and serves HTML from its own older build, referencing CSS
  hashes the current build no longer contains — so pages render completely
  unstyled and every measurement taken against them is fiction. It survives a
  clean rebuild, a cache-busting query and a brand-new tab, so it does not
  look like a server problem; it looks like your code. The tell is on disk:
  compare the stylesheets the prerendered HTML references against the ones
  the browser actually requested. Kill it with PowerShell:
  `Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`
