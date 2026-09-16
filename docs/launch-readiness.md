# Launch readiness

What THE FRONTIER is, what it needs to deploy, and what is deliberately not in
this release. Written at the Phase 8 convergence pass.

The companion document is `docs/phase-8-final-audit.md`, which records what was
measured. This one records what to *do*.

---

## Architecture

Next.js 15 App Router, React 19, TypeScript, CSS Modules. No UI framework, no
CSS framework, no state library.

Five layers, one owner each. `README.md` is authoritative for the model;
`CLAUDE.md` carries the invariants that are not visible in any single file.

| System | Owner | Note |
|---|---|---|
| Content | `content/portfolio.json` → `lib/content` | The only source of facts. Both renderers read it; neither duplicates it. |
| Routing | `lib/routes.ts` | Every route string and the site origin. Nothing is written inline. |
| Route entry | `components/transition/TransitionProvider` | **One** owner, mounted in the root layout, above the router. Pages never schedule their own arrival. |
| Chapters | `lib/transition/chapters.ts` | One registry. A route either has an entry or is not a major route. |
| Boot | `lib/boot/boot.ts` + four rules in `globals.css` | Runs once, on `/` only, pre-paint. Separate from transitions by design. |
| The map | `lib/map/*` | Generated from seeded RNG, not hand-authored paths. |
| The scene engine | `components/scene` | Places, depth, air, camera. |
| 3D | `components/three`, `lib/three` | Hard import boundary, enforced by `npm run check:3d`. |
| Documents | `components/paper`, `components/record` | One substrate, six stocks. A record's identity is data in `lib/record/identity.ts`. |
| Audio | `lib/audio/atmosphere.ts` | Synthesised, not recorded. Off by default, never restored. |

Two rules worth restating because breaking them is how this becomes an ordinary
dark portfolio:

- **A record's identity is its stock, its mark and its figure — never a branch
  on its id.** Adding a fourth project costs one entry in
  `lib/record/identity.ts`.
- **Red is THE HAND only.** Roughly 3% of any view.

---

## Routes

Canonical, and the only ones. All are statically prerendered.

| Route | Place | Chapter |
|---|---|---|
| `/` | Arrival | — (boot sequence, once per session) |
| `/frontier` | The survey map | I · The Frontier |
| `/about` | Camp | II · The Camp |
| `/projects` | The Journal | III · The Journal |
| `/projects/{tuneit,onsight,bobai}` | Field records | — (documents, not acts) |
| `/skills` | Gear | IV · The Workshop |
| `/bounties` | The board | V · The Board |
| `/archive` | The record office | VI · The Archive |
| `/contact` | Trail End | VII · Trail End |
| `/professional` | The résumé | — (deliberately not a chapter) |

`/lab/*` are development benches. They are `robots`-disallowed and absent from
the sitemap, but they do prerender into the production output and remain
reachable by direct URL.

Navigation reaches every destination from every page: the persistent bar
carries the map and the six locations, the drawer carries the same on narrow
screens, and every territory page ends with an onward/return pair.

---

## Assets

Production assets — everything served to a visitor — total **803 KB**, in three
files:

| File | Size | Loaded |
|---|---|---|
| `public/frontier/camp/models/camp-props.glb` | 665 KB | Only at `/about`, only on devices that pass the capability check |
| `public/portrait/basant.jpg` | 120 KB | `/about`, through `next/image` (AVIF/WebP negotiated) |
| `public/portrait/basant-small.jpg` | 18 KB | The 3D scene's texture |

The GLB is the one significant outlier and is deliberately isolated behind the
quality tier.

**Source material** lives in `assets/camp-source/` — 4.9 MB of supplied packs,
of which roughly a tenth is used. It is git-ignored and not redistributed;
provenance and licence state are recorded in `docs/camp-assets.md`. It is the
input to `scripts/bake-camp-props.mjs`; the baked output is what ships.

Everything else that looks like an asset is generated: the map, the ridges, the
torn edges, the paper grain, the cursors and the wind are all SVG, CSS or Web
Audio built at runtime from seeds.

Fonts are five faces via `next/font/google`, self-hosted at build time and
subsetted — no third-party request, no layout shift, `display: swap` on all
five.

---

## Performance

Measured on a cold production build.

| | |
|---|---|
| Shared JS, every route | **104 kB** |
| `/` | 108 kB |
| `/professional` | 108 kB |
| `/skills`, `/archive`, `/contact` | 108 kB |
| `/bounties`, `/projects` | 109 kB |
| Project records | 110 kB |
| `/about` (Camp) | 133 kB |
| `/frontier` (map) | 172 kB |

The three chunks containing three.js total ~880 kB uncompressed and appear in
**no route's initial HTML**. They are fetched after hydration, only where a
scene actually mounts, and only when the capability check passes.

Decisions worth knowing:

- The map's vista and foreground are `dynamic({ ssr: false })` behind an
  861px gate. A phone was parsing every ridgeline to render a list; the hidden
  desktop composition had been 63% of the page's gzipped transfer.
- `SceneStats` and `TransitionDebug` fold away entirely in production via a
  constant webpack can see, so no chunk is emitted for either.
- Camp releases its renderer by hand — scene first, then `dispose()`, then
  `forceContextLoss()` only if the context still exists — deferred one task
  past StrictMode's replay.

---

## Accessibility

Supported, and verified:

- One `h1` per route, no skipped levels, every landmark labelled.
- Full keyboard traversal. The map uses a roving tabindex traversed by
  geography — arrow keys move to the nearest location in that direction, Home
  and End jump to the ends, Escape dismisses.
- Visible focus everywhere, surface-scoped so it is never invisible on paper.
- Touch targets at 44px on coarse pointers, including the persistent chrome.
- No interaction depends on hover alone. The map's field notes are duplicated
  in the index below it; Camp's objects are a real tablist; stamps toggle on
  click as well as hover.
- `prefers-reduced-motion` honoured at the source in 38 stylesheets and at
  every JavaScript decision point, with a global backstop in `globals.css`.
  Camp drops to the illustrated tier rather than rendering a still 3D scene.
- The cursor withdraws to keywords under forced colours, coarse pointers and
  reduced motion.
- Contrast was measured, not assumed; the ratios are recorded beside the
  tokens in `globals.css` and `design/tokens.css`.

Decorative systems carry no information that is not also in the DOM.

---

## Deployment

**Build:** `npm run build`. **Node:** 20 or newer (built and tested on 24).
**Output:** default `.next` — not a static export, because `next/image` and the
OG image route are used.

**The origin resolves itself.** `lib/routes.ts` reads, in order:

1. `NEXT_PUBLIC_SITE_ORIGIN` — set this for a custom domain or a non-Vercel host.
2. `VERCEL_PROJECT_PRODUCTION_URL` — supplied automatically by Vercel, and
   always the *production* domain rather than the per-deployment URL, which is
   what canonical tags and the sitemap need.
3. `http://localhost:3000` — development only. A production build that reaches
   this prints a warning server-side.

On Vercel this needs **no configuration**. Everything absolute — `metadataBase`,
canonical tags, `robots.txt`, `sitemap.xml`, the OG URL — derives from it.

**Before going live:**

- [ ] Deploy and confirm `robots.txt` shows the real host, not localhost.
- [ ] Check the share preview resolves (the OG route is `/opengraph-image`).
- [ ] If a custom domain is added later, set `NEXT_PUBLIC_SITE_ORIGIN` to it so
      the canonical does not keep pointing at the `.vercel.app` subdomain.

There are no environment variables to configure, no secrets, and no analytics.

---

## Known limitations

Intentional, and recorded so they are not rediscovered as bugs.

1. **Project repository and demo links are unresolved.** All three records
   state plainly that links are not yet recorded. Add the URLs to
   `content/portfolio.json` and set `linksStatus: "resolved"` — no code change.
2. **No résumé PDF.** `resumeStatus` is unresolved, the download is hidden, and
   the professional view is offered instead. Drop
   `public/BasantBhushan_CV.pdf` in and flip the status.
3. **Two certificates are unfiled** and say so on the Archive page.
4. **The OG card uses a fallback sans.** `next/og` does not inherit
   `next/font`. Fixing it means vendoring a `.ttf` and adding a font-loading
   path to the image route — deliberately not done.
5. **111 ad-hoc `rgba()` values** remain in component stylesheets against
   non-negotiable #4. They should be converted as their own pass, with
   screenshots.
6. **`design/tokens.css` is stale** relative to `app/globals.css` (192 vs 230
   properties, no cursor tokens). The runtime copy is the correct one.
7. **`/lab` benches ship** in the production output, disallowed but reachable.
8. **The Camp GLB is 665 KB**, unavoidable for the object set, and gated behind
   the capability check.

---

## Future ideas — explicitly NOT in this release

Recorded here so they stay out of the build rather than creeping into it.

- A second 3D environment for any other location.
- Per-project 3D or interactive diagrams beyond the current SVG figures.
- A writing/notes section or blog.
- Analytics of any kind. Not needed, and not added.
- Atmospheric audio beyond the existing wind and Camp fire.
- Internationalisation.
- A CMS. `content/portfolio.json` is the CMS.
- Converting the remaining `rgba()` values — worth doing, but as its own pass.

Phase 8 is the convergence pass. The objective was to make the existing system
feel finished, not to extend it, and the list above is the boundary of that.
