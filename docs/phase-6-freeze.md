# Phase 6 — the freeze

Phase 6 rebuilds `/about` into a production Camp scene. It is the largest
change to a single route the project has had, and it sits on top of systems
that took two phases to get right.

This records what those systems do **now**, at `65fca2c`, so that a regression
in Phase 6 is something that can be noticed rather than something discovered
later. Nothing here is a wish: every figure was measured, and the phase notes
in this directory say how.

## Frozen — must still be true when Phase 6 ends

### Routing

Twelve canonical routes, all prerendered, all reachable as direct URLs. Every
Phase 2 route (`/camp`, `/gear`, `/journal`, `/town`, `/trail-end`) still 404s;
no URL can be guessed into existence. `sitemap.xml` lists exactly 12 with no
`/lab`; `robots.txt` disallows `/lab/`. Full contract in
`docs/routing-contract.md`.

### The record

Every fact on the site comes from `content/portfolio.json`. Unknowns are
`null` with a `*Status: "unresolved"` marker and render as an explanation
rather than a broken link. Eight such markers are currently open.

### Transitions and boot

One owner for route-entry choreography: `TransitionProvider` in the root
layout. Chapters come from `lib/transition/chapters.ts` and nowhere else — Camp
is **Chapter II**, already registered. The boot sequence runs once per session,
on `/` only, decided before first paint. Entering Camp must not raise it.

### The 3D boundary

`three` is imported only inside `components/three` and `lib/three`, enforced by
`npm run check:3d`. Its full contract is `components/three/README.md`, which is
current.

### Failure behaviour

- Capability is resolved before mounting; the illustrated scene is the
  server-rendered first frame and the no-JS frame.
- A lost context falls back; `ThreeScene` owns that decision.
- The renderer's context is released on unmount — `forceContextLoss()`,
  deferred one task past StrictMode's replay.
- `Quiet` bounds the root layout's decorative components, so a failure there
  costs the decoration and nothing else.
- Anchors written onto the page are cleared on unmount, so the controls fall
  back to their illustrated boxes.

### Accessibility

A scene is described identically whether rendered or drawn: same role, same
label, same controls in the same places. The map is one composite widget with
geographic arrow-key traversal. Reduced motion is decided before paint and the
3D layer never mounts under it.

## Baseline — measured at `65fca2c`

Clean `rm -rf .next && npm run build`: **26/26 static pages, no warnings**.
`typecheck` and `check:3d` clean.

```
shared JS for all routes                104 kB

/                    934 B  / 108 kB     /professional     699 B  / 108 kB
/about             15.5 kB / 128 kB      /projects        1.78 kB / 109 kB
/archive           1.06 kB / 108 kB      /skills            952 B / 108 kB
/bounties          1.54 kB / 108 kB      /frontier        17.2 kB / 169 kB
/contact           1.06 kB / 108 kB
```

Transferred JavaScript, measured in a production page rather than read off the
build table:

| route | desktop | narrow (375px) |
| --- | --- | --- |
| non-3D routes | 125 kB | — |
| `/about` | 452 kB | **144 kB** |
| `/frontier` | 450 kB | **185 kB** |

`/about` is the route Phase 6 rewrites. **144 kB on a phone is the number to
watch**: it is what the illustrated Camp costs today, and the phase's mobile
requirement (§25) is that phones keep getting the illustrated scene.

Steady state with the scene running: median frame **16.70ms**, p99 **17.10ms**.
Forty scene mounts moved the heap 86 → 111 → back to 93MB after collection.

## What Phase 6 is allowed to change

`/about` and everything Camp-specific: `components/scenes/*`,
`components/three/scenes/CampScene3D.tsx`, `CampAir`, `CampLight`, and the Camp
entries in `lib/world/camp.ts`.

Shared systems may be **extended** where the brief requires a clean connection
— §30 and §31 need the transition system to carry a map↔camp metaphor — but
not rewritten. The test is whether every other route still measures the same.
