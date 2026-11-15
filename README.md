# Basant Bhushan — the title cards

A personal portfolio for **Basant Bhushan**, set as the opening titles of a
sixties western: one full-screen card at a time, flat poster fields, black
silhouettes, names that slam on a letter at a time, and a different cut
between every card. The genre, never any film or game inside it.

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # production build (stop dev and delete .next first)
npm run start          # serve the production build
npm run typecheck      # tsc --noEmit
npm run check:tokens   # var(--x) that resolves to nothing; raw colours in components
```

`CLAUDE.md` carries the rules that are not visible in any single file.

---

## The site

| Address | What it is |
| --- | --- |
| `/` | **The deck.** Eight cards: the name over a rider, About, a card for each key project (Strata, TuneIt, OnSight), the toolbox billed like a cast ("Featuring"), the record (education, training, certifications), and Send Word. Each card is an anchor: `/#about`, `/#toolbox`, `/#strata`. |
| `/work/[project]` | **A case file** per key project: the problem, the objective, how it is built, the figures and their evidence, the workings, the trouble and the fix, the lesson, the stack. |
| `/professional` | **The same facts as one plain page**, in the same three faces, for somebody who wants them in a minute. It prints as a CV. |

The deck is moved through by scroll or trackpad (one cut per gesture), swipe,
the arrow and page keys, Home and End, the dots, or any `#card` link. Each card
arrives by a cut of its own — crash zoom, letterbox, iris, bars, split, blinds,
push, slash — and its title slams on. The count is a revolver cylinder that
turns a chamber per cut; a click on an empty part of a card leaves a bullet
hole; a tumbleweed crosses the opening now and then; every title kicks up dust.

Every earlier address of the site (the survey map, the field book) redirects to
its place here: see `next.config.ts`.

---

## Structure

```
app/
  layout.tsx            the three faces, metadata, the skip link
  globals.css           the inks (--titles-*), the base, the reduced-motion backstop
  (cards)/page.tsx      /                the deck
  (cards)/work/[project]/page.tsx        a case file
  (cards)/professional/page.tsx          the professional view
  not-found.tsx, error.tsx, global-error.tsx   the same cards, saying what went wrong
  opengraph-image.tsx   the share card: the opening card
  sitemap.ts, robots.ts

components/cards/
  Deck.tsx              the projectionist: which card is up, every cut, the keys
  Slam.tsx              a title set a letter at a time, with its dust
  Cylinder.tsx          the count
  Gunfire.tsx           the bullet holes
  Tumbleweed.tsx        the tumbleweed, drawn from a seeded stream
  SkipLink.tsx          the way past the navigation
  titles.module.css     the deck; case.module.css, professional.module.css, notice.module.css
  art/                  the baked silhouettes and their credits
  shots.ts              each project's front page

lib/
  routes.ts             every address, and the earlier site's (redirect sources only)
  content/              the types, and the single read point for portfolio.json
  cards/                keys (ids next.config reads), the catalog (case files,
                        toolbox credits), the GPU check, the seeded RNG

content/portfolio.json  the only source of facts
scripts/
  titles-silhouette.py  bakes the silhouettes from assets/titles-source/
  check-tokens.mjs      the token check
```

---

## Decisions worth knowing

**Content lives in one file.** `content/portfolio.json` is read by the deck, the
case files and the professional view alike, through `lib/content/portfolio.ts`.
Unknown values are `null` beside a `*Status: "unresolved"` marker, so missing
data is visible rather than invented. `lib/cards/catalog.ts` is the cards'
reading of it: which projects are key, in what order, and which skills each
uses. Strata is work in progress, so its case file sits on its `ongoing` entry.

**The deck owns its motion.** `Deck.tsx` is the one place a card changes. Every
piece of a wipe is a single compositor animation (on, hold, off), and the card
is swapped under the cover by a timer, so nothing waits on the main thread
mid-cut. Card colours are read once at mount, never in the key press.

**The resting state is the finished one.** Everything animates from an offset
toward where it already rests, so a browser that runs none of it shows every
card complete. Reduced motion, or a browser compositing without a GPU
(`html[data-titles-still]`), gets plain cuts and no loops.

**Pictures are baked, not filtered.** The silhouettes are black-on-clear PNGs
made once by `scripts/titles-silhouette.py`, so no card carries a filter or a
blend at run time. The rider is a photograph by Cemrecan Yurtman (Unsplash
licence); the gate is Frederic Remington's *The Fall of the Cowboy* (1895,
public domain). Credits are on the last card and in `components/cards/art/credits.ts`.

## Accessibility

- One card at a time is reachable: the rest are `inert`, so focus and assistive
  technology meet only the card on screen, and every cut is announced.
- Titles are read once, whole, from a visually hidden copy; the slamming
  letters are hidden from assistive technology.
- Every control has a visible focus ring; the skip link leads to the card on
  screen, or to the page.
- `prefers-reduced-motion` gives the finished composition with plain cuts.
