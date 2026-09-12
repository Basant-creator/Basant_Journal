# Phase 5.1 — route transitions: root cause and fix

Required by the phase brief §24. Written before the fix, not after it.

---

## BUG

Chapter introductions did not appear consistently when navigating to major
routes. Reported against Gear, Journal, Bounties, Archive, Contact and About.

Reproduced on 2026-09-12 against the dev build by walking `/frontier` → each
major route as a client-side navigation and probing the DOM 260ms after
arrival:

| Route | Treatment present | Appeared |
|---|---|---|
| `/skills` | `LocationTitle` | yes |
| `/bounties` | `LocationTitle` | yes |
| `/archive` | `LocationTitle` | yes |
| `/contact` | — | **no** |
| `/about` | `ChapterCard` | **no** |
| `/projects` | `JournalOpening` cover | **no** |

Two further measurements:

- Clearing `sessionStorage["frontier.seen.chapter.camp"]` and revisiting
  `/about` produced the card on the first visit and nothing on the second.
- On `/skills`, the `LocationTitle` plate occupies top 110 / height 101 while
  the page's own `<h1>Gear</h1>` sits at top 135. They overlap. For about 1.8
  seconds the route shows two different titles printed over each other.

---

## CAUSE

Three separate causes, which is why the symptom looked random.

### 1. There was no transition system

Route entry was never centralised. Each page reached for whichever component
seemed right when it was written:

- `/frontier`, `/about` — `ChapterCard`, session-gated
- `/projects` — `JournalOpening`, session-gated
- `/skills`, `/bounties`, `/archive` — `LocationTitle`, every arrival
- `/contact`, `/professional` — nothing

Three behaviours and two omissions, none of which knew the others existed.
Nothing was broken in the sense of failing; every component did exactly what
it was written to do. The system was the bug.

### 2. Session persistence, mistaken for a transition

`ChapterCard` and `JournalOpening` gate on `sessionStorage` via
`lib/scene/announce.ts`: a beat plays once per session and never again. That
is the right rule for a *story beat* and the wrong rule for *route entry*.
Walking Map → Camp → Map → Camp shows the card once, and every arrival after
the first is silent — which is precisely the "sometimes it works" the report
describes. The brief names this directly in §7E: a chapter introduction should
be driven by navigation context, not by accidental persistent state.

### 3. A nameplate is not a chapter card

`LocationTitle` was designed as an in-header nameplate: absolutely positioned
inside the page's own header box, no veil, deliberately unable to cover
anything. That is correct for what it was built for and wrong as a route
entry treatment, because the thing it cannot cover is the heading it is
sitting on top of. The evocative name and the plain name end up printed in
the same place at the same time.

### What was *not* the cause

Worth recording, because the brief lists them as candidates and they were
checked:

- **Stale pathname / not reacting to route changes** (§7A, §7B). Page
  components remount on navigation inside the `(survey)` layout; effects ran
  every time. Verified by the probe above — `LocationTitle` fired on all three
  of its routes, on every arrival.
- **Animation state not resetting** (§7D). `LocationTitle` and `ChapterCard`
  both return to their resting state. There is one real instance of this
  class, found and fixed during Phase 4 step 14 and documented below, but it
  was not the cause of this report.

### A related defect found during Phase 4 step 14

`JournalOpening` could strand its cover permanently. React invokes an effect
twice in development; the first run marked the journal seen and scheduled the
opening, the cleanup cancelled the timers, and the second run read the flag it
had just written, concluded the opening had already happened, and returned.

This is the same family as cause 2 — a decision that depends on state the
decision itself writes. The fix there was a ref that outlives the effect runs,
plus a guard effect that forces the cover off regardless. The architecture
below removes the family rather than the instance.

---

## FIX

### One owner

`components/transition/TransitionProvider.tsx`, mounted in the **root** layout
so it sits above the router and covers the landing page as well as the survey
group. Every route-entry treatment now comes from it. Removed:

- `ChapterCard` from `/frontier` and `/about`
- `LocationTitle` from `/skills`, `/bounties`, `/archive`
- `RouteTransition` and `lib/motion/passage.ts` — deleted outright. The paper
  wipe was a second owner of route entry, and §7C is right that two owners is
  the bug. The torn-paper system it was built on remains, for in-page reveals,
  which is what it was for.

`/contact` and `/professional`, which had nothing, now get their treatment
from the same registry as everywhere else — not because anyone remembered
them, but because a route either has a registry entry or is not a major route.

### One registry

`lib/transition/chapters.ts` holds every chapter name. Nothing infers a
chapter from text on the destination page; the routing layer knows where it is
going before the page exists, which is what allows the chapter to be announced
while the destination is still arriving.

Chapter numbering collided with the journal's, which numbered its three
documents Chapter I–III. A reader would have met "Chapter III · The Journal"
and then, inside it, "Chapter I · TuneIt". The routes are now the chapters and
the journal's three are Records.

### One lifecycle

`IDLE → EXIT → LOADER → CHAPTER → ENTER → IDLE`, and three invariants:

1. **The chapter is read from the rendered route, never the intended one.**
   Chapter text is only ever `chapterFor(pathname)` and is only shown once the
   pathname has changed. §12's failure — "Chapter III · The Journal" over a
   rendering `/skills` — is unrepresentable rather than merely avoided.
2. **The newest navigation wins.** Every scheduled step carries the token it
   was scheduled under and does nothing if a newer one has started.
3. **It always returns to IDLE.** A guard timer runs on every transition.

Navigation is never delayed. Clicks are observed in the capture phase and not
prevented; the router acts on its own schedule while the curtain plays over
the top.

### The mark

`FrontierLoader` — a surveyor's index plate: a struck ring carrying six
station marks around a centred sight, with an index arm that *steps* between
them rather than sweeping. Stepping is what keeps it from reading as a loading
spinner. Eleven drawn elements, no image, no font, nothing fetched: it appears
precisely when someone is already waiting, so it is not allowed to be a reason
they are.

These routes are prefetched and arrive in about a hundred milliseconds, so
without a floor the mark was never seen at all. It holds for a minimum of
300ms. That is the one place this system deliberately spends the visitor's
time, and it is the phase's stated purpose.

---

## PREVENTION

The fix is not "the pages now call the right component". It is that pages no
longer make this decision at all.

- **A route cannot silently have no entry treatment.** There is one registry.
  A route is in it or it is not a major route — there is no third state where
  someone forgot. That is what `/contact` and `/professional` were.
- **A route cannot invent its own treatment.** Route entry is owned above the
  router. A page adding a competing arrival would now be visibly fighting the
  curtain rather than quietly filling a vacuum.
- **The chapter cannot disagree with the route.** It is derived from the
  rendered pathname, not carried from the click. Disagreement is not a bug
  that was fixed; it is a state the code cannot express.
- **Session persistence is out of the route-entry path entirely.** Nothing
  about whether a chapter appears depends on storage. `JournalOpening` still
  uses the session for its cover, but that is a scene flourish rather than the
  route announcing itself, and the announcement no longer depends on it.
- **Transitions cancel rather than stack**, so the interruption class of bug
  cannot accumulate.
- **There is a readout.** `TransitionDebug` prints current, next, transition
  type, chapter and state in development, and folds away in production. The
  original bug was invisible — a route either announced itself or quietly did
  not, and seeing it took a scripted DOM probe. The next one will be visible
  in a glance.

---

## TEST MATRIX

Run against the dev build, driven by script and read from the DOM rather than
by eye.

| # | Case | Expected | Result |
|---|---|---|---|
| 1 | `/frontier` → `/skills` | loader → Chapter IV · The Workshop | pass |
| 2 | `/frontier` → `/projects` | loader → Chapter III · The Journal | pass |
| 3 | `/frontier` → `/bounties` | loader → Chapter V · The Board | pass |
| 4 | `/projects` → `/projects/tuneit` | no curtain | pass |
| 5 | `/projects/tuneit` → `/projects/onsight` | no curtain | pass |
| 6 | direct load `/skills` | short chapter, no loader | pass |
| 7 | `/skills` → `/frontier`, then Back | Chapter I on the way out, Chapter IV on the way back | pass |
| 8 | `/frontier` → `/skills` → `/bounties`, 120ms apart | Chapter V only; Workshop never appears | pass |
| — | → `/professional` | no curtain | pass |
| — | `/frontier` → `/contact` | Chapter VII · Trail End | pass |
| — | mobile, reduced motion | chapter shown, movement removed, debug hidden | pass |

Test 8 is the one worth keeping: the intermediate route never rendered a
chapter at all, rather than rendering one and having it replaced.
