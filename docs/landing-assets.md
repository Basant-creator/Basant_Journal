# Landing assets

The horse on the landing page: what was supplied, what ships, and what still
needs confirming.

---

## Provenance

| | |
| --- | --- |
| supplied as | `Horse by Quaternius - qvTrSG9pZF.glb` |
| supplied by | the repository owner, into `Downloads` |
| attributed to | **Quaternius** |
| generator string | `FBX2glTF v0.9.7` |
| `asset.copyright` | absent |
| licence file alongside | none |
| source kept at | `assets/horse-source/horse.glb` (git-ignored, 1.08 MB) |
| what ships | `public/frontier/landing/horse.glb` (314 kB) |

**Licence status: attributed, not yet verified.** Quaternius publishes model
packs under CC0, which if it holds for this file makes it usable here without
restriction or attribution. That is the expectation rather than a checked fact:
the file carries no `copyright` field and arrived without a licence document,
so the same rule that governs the Camp packs governs this one — CLAUDE.md's
second non-negotiable is that no copyrighted asset ships, and "probably CC0"
is not the same as knowing.

**What is needed:** the original listing this was downloaded from, and its
stated licence, recorded in this table. Until then treat this row as
`license-review`. It is a lighter risk than the Camp packs — Quaternius is a
single named creator with a consistent public licence, where those two arrived
as bare geometry with no attribution at all — but it is the same kind of gap.

---

## What was done to it

`scripts/bake-horse.mjs`, run once:

```
node scripts/bake-horse.mjs
```

| | before | after |
| --- | --- | --- |
| bytes | 1,108,124 | 313,824 (**−72%**) |
| animations | 26 | 2 |
| accessors | 943 | 113 |

**Nothing about the horse changed.** The mesh, the skin, the 68-bone skeleton
and the vertex weights are passed through byte-for-byte; the bake only drops
animation data and rebuilds the buffer around what is left.

The 26 clips were 13 duplicated — FBX2glTF emits every clip twice, once bare
and once prefixed `AnimalArmature|` — and of the 13 real ones the landing plays
two:

- **`Gallop`** — the herd crossing.
- **`Idle`** — what a stopped horse does, and what reduced motion parks on. A
  frozen gallop is a horse suspended in mid-air, which is a stranger thing to
  show someone who asked for less movement than a horse simply standing.

The other 24 are a headbutt, a kick, a death, two hit reactions, a walk, a jump
and several idles: animation data sitting in a file that loads before the
visitor has reached anything.

That mattered because of one rule. **The landing has to be lighter than the
Camp** — it loads first, and the Camp's entire prop set is 665 kB. At 1.08 MB
the horse inverted the budget the rest of the site was built to respect. At
314 kB, with no textures at all, it does not.

---

## How it is used

- **Six horses, one model.** `SkeletonUtils.clone` per instance, because a
  skinned mesh cloned with `.clone()` shares its skeleton and every copy then
  plays the same pose.
- **One `AnimationMixer` each**, wound forward to its own point in the stride —
  a mixer owns a time, so a shared one is a shared gait.
- **The gait is tied to ground speed.** A horse whose legs turn over at the
  clip's authored rate while moving faster is skating, which is the most
  obvious tell in an animated crowd.
- **One material for the herd.** The model arrives with eight — coat, mane,
  muzzle, hooves, two eye materials — and at this distance every one resolves
  to the same dark shape. Overriding them is both the cheaper draw and the
  correct picture: the landing is a tonal composition, and eight lit materials
  from an asset pack read as a different world dropped into this one. Same
  decision, and same reason, as the Camp props in `docs/camp-assets.md`.
- **No rider.** Horses only.

Quality tiers draw 6 / 4 / 2 of them (`HERD_BY_TIER`), and the whole scene sits
behind the capability check — a visitor without WebGL, on a constrained device,
or asking for reduced motion keeps the drawn landscape, which is complete on
its own.
