# Phase 2 — implementation notes

What was built, what changed from Phase 1, and what Phase 3 inherits.

---

## 1. One deliberate departure from Phase 1

**The map moved from ink-on-dark to ink-on-parchment.**

Phase 1 §8 drew the map as light lines on the dark ground, with `--map-line`
`#806D50` at 3.58:1. Phase 2's brief calls for a parchment base, so the sheet is
now a parchment field with ink cartography laid on it.

This is the better call for two reasons beyond the brief:

- **Authenticity.** A surveyor's working map is ink on paper. Light lines on
  black is a screen convention, not a cartographic one.
- **Contrast.** Map ink `#403225` on the field `#B7A27D` measures **4.98:1** —
  it clears AA for text, where the old scheme only cleared the 3:1 graphics bar.
  Location labels are now genuinely readable rather than merely perceivable.

THE DARK still dominates the page: the sheet is inset in a dark field, burned at
its edges, and sits under the atmospheric layer. The layer model is intact — the
map simply became THE TERRAIN, its own layer, rather than a drawing on THE DARK.

Contrast values introduced with it:

| Pairing | Ratio | Use |
|---|---|---|
| `--map-ink` on `--map-field` | 4.98:1 | Labels, primary linework |
| `--map-ink` on `--map-plate` | 9.44:1 | Label plates, instrument faces |
| `--map-hand-text` (`--color-red-dark`) on field | 5.28:1 | Red annotation **text** |
| `--map-hand` (`--color-red`) on field | 3.75:1 | Red **marks and rules** only |
| `--map-water` on field | 3.16:1 | Watercourses (graphics threshold) |

The rule that falls out: **red text on the sheet uses `red-dark`; red lines use
`red`. Never the reverse.** This is encoded in `--map-hand` / `--map-hand-text`.

---

## 2. Two engineering decisions

**Generated terrain.** `lib/map/terrain.ts` builds the sheet from seeded
generators rather than authored path data — ridges, hachures, contour rings,
river and banks, marsh, road, scrub stipple, graticule, triangulation. Roughly
900 path strings, none of them typed by hand. The seed is fixed
(`lib/map/rng.ts`), so SSR and the client agree exactly.

**Entry in CSS, interaction in Motion.** The brief asks for Motion, and Motion
drives the camera, where interruptible animation matters. But the *entry*
choreography is CSS gated on a pre-paint `data-entry` stamp, because two
requirements rule Motion out there:

1. Nothing essential may be hidden behind an animation. Without the stamp, no
   rule matches and every element renders visible — a JS failure costs nothing.
2. The decision to play must be made before first paint, or the visitor sees one
   frame of the finished map before it rewinds. A React effect is too late.

---

## 3. Three bugs found and fixed during the build

- **Grain at full opacity.** The texture layer carried the grain on its base
  `background-image` *and* on a `::before` at 0.04, so the full-strength
  turbulence covered the page. The two effects need different opacities, so they
  need different elements.
- **Hydration mismatch on `<html>`.** The pre-paint script stamps an attribute
  React did not render, which React reported as a mismatch on every load.
  `suppressHydrationWarning` on `<html>` is the intended solution for exactly
  this pattern.
- **The mobile drawer rendered open.** `.drawer { display: block }` inside a
  media query outranks the user-agent `[hidden]` rule. Fixed by keying the rule
  on `[data-open="true"]`, plus a global `[hidden] { display: none !important }`
  so this class of bug cannot recur elsewhere.

A fourth, smaller one: SVG `<title>` was receiving four children; React cannot
flatten an array into a title node. It is now a single template string.

---

## 4. Definition of done

**Visual** — landing establishes the concept in the first screen; the map reads
as a surveyor's sheet (compass rose, neat line, graticule, scale bar,
triangulation, place names); the four layers are visibly distinct; the red
annotation system holds at roughly five marks on the sheet.

**Interaction** — hover, focus and selected states all differ by shape and fill;
Journal is drawn at 1.4× and the Camp → Journal shortcut is the only red route;
Professional View is reachable from the landing, the nav, every location stub
and the mobile foot; the entry sequence plays once, is skippable by any click,
key or scroll, and is remembered in `localStorage`.

**Responsive** — desktop is the full sheet; tablet drops the finest linework
(cover and triangulation) and stacks the index; below 860px the map is replaced
by a vertical trail of paper cards, not scaled down. No interaction is
hover-only.

**Engineering** — App Router, TypeScript throughout, `tsc --noEmit` clean, 15
static routes, 162 kB first load on the map route and 107 kB elsewhere, no
duplicated project data.

---

## 5. What Phase 2 deliberately did not build

Per the brief: full project pages, the complete skills and contact pages, the
detailed résumé mode, any backend. The six non-Journal locations render an
honest "survey in progress" page rather than an empty page dressed as a finished
one, and their markers carry a dashed ring to say so on the sheet itself.

Journal is the exception — the primary trail has to lead somewhere real, so it
lists the three systems with their real metrics and stacks.

---

## 6. Carried into Phase 3

1. **Project URLs.** `github` and `liveUrl` are `null` on all three projects with
   `linksStatus: "unresolved"`. The CV cites GitHub for all three and a live
   deployment for TuneIt. Every project card must link to running code — the
   credibility argument depends on it.
2. **The résumé file.** `links.resume` points at `/BasantBhushan_CV.pdf`, which
   is not yet in `public/`. Marked `resumeStatus: "unresolved"`.
3. **The display face.** Cinzel is still the placeholder Phase 1 flagged. Swap is
   one line in `app/layout.tsx`; nothing else references the family name.
4. **The wordmark.** Still set in the display face rather than drawn as custom
   SVG lettering. Phase 1 §4 makes the case for drawing it.
5. **Photography.** `visualAssets` is an empty array on every project, and
   `public/photographs/` is empty. The layouts support a no-photograph variant,
   but it is weaker.
6. **`metadataBase`.** Set to `https://basantbhushan.dev` as a placeholder;
   correct it before deploying or OG URLs will be wrong.
