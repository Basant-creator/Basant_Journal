# Routing & interaction contract — implementation notes

How the contract is satisfied, where a decision needed making, and the three
Phase 2 behaviours it deliberately overturned.

---

## 1. Route map

All twelve canonical routes exist, are statically prerendered, and work as
direct URLs with no prior navigation.

| Route | Page | File |
|---|---|---|
| `/` | Landing | `app/page.tsx` |
| `/frontier` | Survey map | `app/(survey)/frontier/page.tsx` |
| `/projects` | Journal index | `app/(survey)/projects/page.tsx` |
| `/projects/tuneit` · `/onsight` · `/bobai` | Field records | `app/(survey)/projects/[project]/page.tsx` |
| `/professional` | Professional view | `app/(survey)/professional/page.tsx` |
| `/about` | Camp | `app/(survey)/about/page.tsx` |
| `/skills` | Gear | `app/(survey)/skills/page.tsx` |
| `/bounties` | Bounties | `app/(survey)/bounties/page.tsx` |
| `/archive` | Archive | `app/(survey)/archive/page.tsx` |
| `/contact` | Trail End | `app/(survey)/contact/page.tsx` |

Phase 2's `/camp`, `/gear`, `/journal`, `/town` and `/trail-end` are gone and
now 404. The dynamic `[location]` catch-all was deleted with them: each
territory is its own route, so no URL can be invented by typing one.

---

## 2. Three decisions the contract forced

**Town merged into Archive.** §2 and §8 list no `/town`, and §6 writes the
location as "Town / Archive" — one place. Rather than drop the settlement, the
town is now drawn as *terrain*: eleven buildings and a meeting-hall spire near
the tributary, labelled `TOWNSITE`, with the Archive marker standing just
north-east of it as the record office. The territory still reads as inhabited
and no second URL exists for the same content.

**Arrow keys move by geography, not DOM order.** §25 is explicit, and it is the
only behaviour that makes sense on a spatial surface. `lib/map/navigation.ts`
scores candidates inside a 90° cone by distance along the axis plus a sideways
penalty, widening to the half-plane if the cone is empty so a key press is
never swallowed. WASD works alongside the arrows. Trail order is still
reachable through Home/End and the index list.

**The record sequence does not wrap.** TuneIt → OnSight → BobAI → *Journal*.
`recordNeighbours()` in `lib/content/portfolio.ts` returns the index rather than
the first record at either end, so a reader always knows when they have seen
everything.

---

## 3. Three Phase 2 behaviours this overturned

**Navigation no longer waits for the camera.** Phase 2 held the route change
for 520ms so the map could pan first. §31 forbids exactly that. Markers are now
plain links; `onPointerDown` starts the camera and the active treatment, and the
browser follows the link immediately. The transition plays alongside the route
change instead of in front of it.

**Unimplemented locations no longer navigate.** §9 requires a visible,
focusable, described marker that goes nowhere rather than a fake URL. A
`surveying` location now renders as a focusable `role="link"` group with
`aria-disabled`, a dashed ring, an `UNMAPPED` sub-label, and a field note
saying no record is filed. Every location is currently `mapped`; promoting or
demoting one is a single word in `portfolio.json` and the map component does
not change.

**Route strings left the components.** `lib/routes.ts` holds the map, and the
content model carries each location's and project's own canonical `route`.
Nothing writes `"/projects/tuneit"` inline any more.

---

## 4. History, state and deep links

- **Nothing about map interaction reaches the URL.** Hover, focus, camera
  position and the engaged marker are component state. `/frontier` is the only
  map URL; there is no `?x=&y=&zoom=`.
- **Back and forward are untouched.** Every navigation is a plain `Link`; no
  custom history, no interception. `/` → `/frontier` → `/projects` →
  `/projects/tuneit` unwinds exactly in reverse.
- **Fragments, not query parameters, for in-page position.**
  `/professional#tuneit` and `/projects/tuneit#architecture`. Section links are
  plain anchors, so the browser owns the URL update and the scroll; the
  scroll-spy highlight in `RecordNav` is the only part that needs JavaScript,
  and it is additive.
- **Scroll.** App Router scrolls to top on navigation and restores position on
  back/forward. Anchor targets carry `scroll-margin-top` to clear the sticky
  bar. `scroll-behavior: smooth` is switched off under reduced motion in
  `globals.css`.

---

## 5. No dead ends

Every page ends with an onward navigation: previous and next along the trail,
plus a **Return to map**. Field records offer *Return to map* and *View
professional record* — never a forced walk back through the index, because the
mental model is Map → Journal → Record → Map.

The professional view's exit is `/frontier`, not `/`: leaving the professional
layer returns to the interactive world rather than to the beginning. The
navigation bar's toggle flips to *Return to frontier* while you are in it.

The 404 reads "Survey record not found — this territory has not been mapped",
with **Return to frontier** as the primary action and no implication of error.

---

## 6. Failure safety

Nothing on the site depends on an animation completing.

- The entry choreography is gated on a pre-paint `data-entry` stamp. Without
  the script, no rule matches and every element renders at full opacity.
- Field-record sections animate in from a *visible* resting state with
  `animation-fill-mode: both`; if animations never run, the `from` state is
  never applied and the content is simply there.
- Section anchors, every navigation link, and the whole of the professional
  view work with JavaScript disabled.
- Under `prefers-reduced-motion` the camera is pinned to rest, every duration
  collapses to 1ms, and navigation behaviour is unchanged.
- A **passage** — the paper wipe between two routes — is announced alongside
  the click and waits for nothing. It takes no pointer events, holds no focus,
  locks no scroll, and always opens: on arrival, or on a hard 1.5s timeout if
  arrival never comes. It is raised only by a plain left click that is
  actually navigating in this tab, never by a modified or middle click, and
  never under reduced motion. The page it covers rendered from the server and
  is live underneath the whole time.

---

## 7. The main trail entry

Camp carries two separate ideas, and they are deliberately different objects:

| | Control | Destination |
|---|---|---|
| **Location** | the Camp marker on the sheet | `/about` |
| **Trailhead** | the `FOLLOW THE TRAIL →` bar | `/projects` |

**The trailhead sits beneath the sheet, not on it.** It was first built pinned
beside Camp, which looked better and was wrong: its box overlapped the Camp
marker's own hit area, so the control for the journey was covering the location
it points at — at some widths blocking it outright. Below the sheet it is
always fully visible, never blocks the map, and cannot collide with a marker at
any size. It is a real `<a>`, so keyboard, screen reader and touch all reach it;
an SVG path is never the only way into the Journal.

**Arrival is framed on Camp and opens out.** The settle animation starts the
sheet at 1.22x centred on Camp and pulls back to the whole territory over
1.9s. Camp reads as the trailhead without the camera ever parking somewhere
that hides the rest of the map. Camp is also the initial active location, so
its marker and label are already resolved on arrival.

**Direction is stated statically.** Three survey arrows sit on the primary
trail, computed from the curve itself (`pointOnArc`) so they lie on the line
and point along it. The trail also drifts its dash pattern once every nine
seconds — the single looping element Phase 1 budgeted for drifting dust, which
was never built. Both the arrows and the drift are switched off under reduced
motion, and the arrows alone carry the direction when nothing moves.

**Neither the trail nor the shortcut is the only way.** Journal remains
directly clickable on the map and in the index; every other location is
reachable without touching the trail at all.

---

## 8. Still outstanding

1. **Project URLs.** `github` and `liveUrl` remain `null` with
   `linksStatus: "unresolved"`, so the *View source* and *Live system* buttons
   are not rendered at all — §30's "do not render broken links". Once the URLs
   are filled in, the buttons appear automatically.
2. **The résumé file.** `links.resumeStatus` is `"unresolved"`, so `/archive`
   shows an explanation instead of a download button. Drop
   `BasantBhushan_CV.pdf` into `public/` and flip the status to `"resolved"`.
3. **`metadataBase`** is still the placeholder `https://basantbhushan.dev`.
