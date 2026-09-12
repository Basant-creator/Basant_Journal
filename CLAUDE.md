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
  inside `components/three` and `lib/three`. `three` is ~700 kB against a
  ~103 kB shared bundle. Enforced by `npm run check:3d` — run it before every
  commit that touches imports.
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

- The in-app browser pane is unreliable here: scrolled screenshots composite
  blank and CSS transitions freeze when the pane isn't painting, so
  `getComputedStyle` returns stuck intermediate values. **Verify structurally
  via the DOM**, and say plainly when a visual could not be confirmed by eye.
- `next dev` and `next build` share `.next` and corrupt each other. Stop the dev
  server and remove `.next` before building.
