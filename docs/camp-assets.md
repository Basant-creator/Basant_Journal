# Camp assets

What was supplied, what was taken, what was refused, and why.

Two packs arrived. Between them they hold **80 objects**; **11** are in the
Camp. That ratio is the point of this document.

---

## Provenance, and a licence that has to be checked

**Neither pack carries a licence file, a readme, or a copyright field.** Both
were supplied as bare geometry.

| | old-west fort pack | town kit |
| --- | --- | --- |
| supplied as | `old_west_fort_asset_pack_gltf.zip` | `model.glb` |
| contents | `scene.gltf` + `scene.bin`, 3.74 MB | one GLB, 1.33 MB |
| `asset.generator` | `fab-model-conversion` | `3dassets.dev ingest` |
| node structure | `Sketchfab_model / root / GLTF_SceneRootNode / …` | flat, `NNN-name/N` |
| `asset.copyright` | absent | absent |
| licence file in archive | **none** | **n/a — single file** |

The fort pack's node hierarchy is a Sketchfab export and the generator string
says it passed through Fab. Both of those normally ship a licence alongside the
model; this archive has two files in it and neither is one.

**This is unresolved and it is a blocker for a public deploy.** §30 says not to
include an asset whose licence is unclear, and CLAUDE.md's second
non-negotiable says no copyrighted assets. The work below was done because the
assets were supplied for it; the licence still has to be established before the
site goes anywhere public. What is needed is the original listing for each pack
and its licence terms, recorded in this section. Until then, treat both rows as
`license-review`.

Nothing from either pack ships as-supplied in any case — see *What actually
ships*.

---

## Inventory and decisions

### old-west fort pack — 16 objects, 69,081 triangles, 49 materials, no textures

| object | tris | size (m) | decision | reason |
| --- | --- | --- | --- | --- |
| `campfire_3` | 976 | 1.23 × 0.25 × 1.21 | **USE** — hero | A stone ring with logs. The one thing the drawn fire never had |
| `barrel_1` | 4,116 | 0.66 × 0.74 | **USE** — primary | Staved, hooped, correct silhouette |
| `bucket_2` | 2,684 | 0.44 × 0.45 | **USE** — primary | Belongs beside a fire; reads at foreground scale |
| `crate_5` | 1,228 | 0.58³ | **USE** — primary | The box survey gear travels in |
| `axe_0` | 4,578 | 0.20 × 0.53 | **USE** — secondary | §6: one tool left mid-job says "somebody works here" |
| `tent_14` | 1,112 | 4 × 2.45 × 6.64 | **USE** — secondary | A second, lower tent. Two tents read as a camp |
| `fort-fence_6` | 6,308 | 2.7 × 3.39 | **REJECTED** | Palisade. Builds a fort |
| `fort-gate_7` | 21,402 | 7.44 × 5.5 | **REJECTED** | 31% of the pack's triangles, and it is a gate in a fort |
| `guard-tower-L1_8` | 3,404 | 2.75 × 3.32 | **REJECTED** | Military. Wrong century of intent |
| `gueard-tower-L2_9` | 4,134 | 2.89 × 3.91 | **REJECTED** | As above (spelling theirs) |
| `stables_13` | 4,709 | 5.69 × 2.89 | **REJECTED** | A building. Makes the camp a settlement |
| `knife_10` | 709 | 0.03 × 0.5 | **REJECTED** | Weapon. §46 |
| `revolver_11` | 3,544 | 0.55 × 0.27 | **REJECTED** | Weapon. §46 |
| `rifle_12` | 4,509 | 1.79 × 0.33 | **REJECTED** | Weapon. §46 |
| `command-tent_4` | 2,668 | 5.37 × 3.45 × 5.11 | **REJECTED** | The Camp's own tent is better: it has ridge sag and panel bow, built at upgrade 08. §9 — a supplied asset replaces a placeholder only when it is dramatically better, and this one is flatter |
| `tnt_15` | 3,000 | 0.68 × 0.95 | **REJECTED** | Explosives. Not a surveyor |

### town kit — 64 objects, 39,814 triangles, 11 materials, 2 embedded WebP

Better engineered than the fort pack: `KHR_mesh_quantization`, one coherent
material set (pine / painted / glass / brass / gilt / iron / adobe / dust /
canvas / rope / redrock), all matte. And overwhelmingly a **town**.

| object | tris | decision | reason |
| --- | --- | --- | --- |
| `050-supply-crate` | 204 | **USE** — primary, ×2 stacked | 204 triangles. The cheapest useful object in either pack |
| `048-whiskey-barrel` | 1,096 | **USE** — secondary | A small cask beside the crates |
| `051-grain-sack-stack` | 1,404 | **USE** — secondary | Supplies that are not another box |
| `053-wagon-wheel` | 1,032 | **USE** — secondary | §6: the load arrived somehow |
| `054-hay-bale` | 648 | **USE** — secondary | Under the axe. Something to cut |
| `041/042-hitching-rail` | 910 | **PLACED, THEN CUT** | See *What was placed and removed* |
| `062/063-telegraph-pole` | 1,468 | **PLACED, THEN CUT** | See *What was placed and removed* |
| 6 × `*-facade-bay` | 1,404–2,460 | **REJECTED** | Saloon, bank, hotel, sheriff, general store, undertaker. A town |
| 6 × `boardwalk-section`, 3 × `porch-roof`, 3 × `upper-balcony`, 5 × `clapboard-wall-bay`, `rear-wall-door-bay`, 2 × `shed-roof-deck` | 188–996 | **REJECTED** | Street architecture |
| `028-saloon-bar-counter`, `029-saloon-back-bar`, `030-upright-piano`, `039-brass-spittoon`, `040-saloon-swing-doors` | 472–2,436 | **REJECTED** | Saloon interior |
| 5 × `033–038 saloon-chair`, `032-saloon-round-table`, `036-saloon-card-table` | 608–1,988 | **REJECTED** | The Camp has its own chair and a purpose-built trestle table |
| 3 × `044–046 street-oil-lamp` | 316 | **REJECTED** | The Camp has a lantern, built at upgrade 15, with a flame inside glass |
| `056-frontier-church`, `057-jail-cell-block`, `058-timber-water-tower`, `059-windmill-water-pump`, `060-town-well`, `061-town-gallows`, `047-wanted-poster-board`, `031-potbelly-stove`, `043-water-trough`, `052-boot-scraper`, 2 × `street-corner-post` | 196–2,012 | **REJECTED** | Town furniture, and a gallows |

---

## What was placed and removed

Two decisions were made on screen rather than on paper, and both are §34 —
fewer assets, better place.

**Two hitching rails, at z = −6.4 and −6.75.** At six metres out a 1.2 m rail
lands exactly on the horizon line. What it drew was a horizontal bar across the
mountains, cutting the composition in half at the precise height the depth was
coming from. Removed.

**A telegraph pole.** The better idea of the two: a surveyed line is the one
piece of infrastructure that belongs in a surveyor's country, because somebody
measured where it would go. But it is seven metres of vertical in a frame whose
entire back half is already vertical — a treeline and three ridges — and at any
distance where it read as a landmark it took a third of the frame height and
argued with the trees. Removed.

The background band is now empty, and that is the answer rather than an
omission: the landscape behind this camp was finished at upgrade 07. The packs
had nothing to add to it.

---

## What actually ships

`scripts/bake-camp-props.mjs` reads both packs from `assets/camp-source/`,
which is outside `public/` and therefore outside the deployment, and writes:

```
public/frontier/camp/models/camp-props.glb   665 kB   11 props   19,078 triangles
```

**Geometry only. No materials, no textures, no node hierarchy.**

That is the important decision. The packs came from two artists with two ideas
about what wood looks like — the fort pack ships 49 materials, most of them
copies of each other (`wood3`, `wood3.001`, `wood3.002`), all double-sided, all
untextured — and the Camp has spent twenty steps deciding for itself, in
`CampTimber`, `CampLeather` and `palette.ts`, at one blue-hour exposure. A
barrel arriving in its own brown beside a table built from `useTimberTexture`
is §13's failure in one object: something announcing that it came from
somewhere else.

So the forms come through and the surfaces stay behind. Six shared materials
replace ninety-eight.

Each prop is baked with its world transform applied, recentred on its own
footprint, and dropped so its lowest point sits at y = 0 — which makes
placement a position and a turn, and is what §22 and §23 ask for: nothing
floats, nothing sinks, and grounding is not a per-object fudge.

| prop | tris | size (m) | surface | from |
| --- | --- | --- | --- | --- |
| `fireRing` | 976 | 1.23 × 0.25 × 1.21 | rock | fort `campfire_3` |
| `barrel` | 4,116 | 0.66 × 0.74 × 0.66 | timber | fort `barrel_1` |
| `bucket` | 2,684 | 0.44 × 0.45 × 0.43 | timber | fort `bucket_2` |
| `crate` | 1,228 | 0.58 × 0.58 × 0.58 | timber | fort `crate_5` |
| `axe` | 4,578 | 0.20 × 0.53 × 0.04 | iron | fort `axe_0` |
| `leanTent` | 1,112 | 4.00 × 2.45 × 6.64 | canvas | fort `tent_14` |
| `supplyCrate` | 204 | 0.99 × 0.62 × 0.83 | timber | town `050-supply-crate` |
| `caskSmall` | 1,096 | 0.74 × 0.90 × 0.70 | timberDark | town `048-whiskey-barrel` |
| `sacks` | 1,404 | 1.65 × 0.86 × 1.40 | sack | town `051-grain-sack-stack` |
| `wagonWheel` | 1,032 | 1.20 × 1.88 × 0.52 | timberDark | town `053-wagon-wheel` |
| `bale` | 648 | 1.11 × 0.52 × 0.70 | sack | town `054-hay-bale` |

The fort pack's triangle counts are poor value — a 44 cm bucket at 2,684
triangles, a hand axe at 4,578 — because that pack is unwelded and
smooth-shaded throughout. They survive because there are eleven of them and
because they are the objects nearest the camera. If the budget ever needs the
room, the axe and the bucket are where it is.

---

## Composition

`lib/world/campProps.ts` holds the placement, deliberately outside
`components/three`: composition is a design question and should be legible
without opening a renderer.

Placement is written against **the frame**, not the world, and the first pass
got that wrong in a way worth recording. The camera *arrives* from
[1.9, 3.6, 16.2], which suggests a scene tens of metres across. It comes to
**rest** at [0.35, 1.62, 5.6] on a 36° lens, where the frame is about seven
metres wide at the fire's depth. Nine props were placed between four and nine
metres out — which is to say, where nobody would ever see them. The scene
gained two thousand triangles and nothing else.

The fire is at x = −1.15 and the table at x = +0.75, so the left of the frame
is occupied and the right is empty. The supplies go right.

| band | z | what |
| --- | --- | --- |
| foreground | 0 → +1.3 | fire ring, bucket, crate, bale + axe |
| midground | −0.3 → −4.3 | barrel, two stacked supply crates, cask, sacks, wagon wheel, second tent |
| background | — | nothing. See above |

A second thing was found on screen: a barrel, two crates and a cask placed
inside a metre of each other intersected into a single dark slab the size of
the table — §22's "intersecting meshes" and "obvious clipping" together, which
from the camera read as a wall rather than as supplies. Each now stands clear
of its neighbours by more than its own width, except the two crates, which are
stacked on purpose, with the upper one resting at exactly the lower one's
height rather than hovering above it.

---

## Quality tiers

§16 asks the tiers to change density and never composition, so the cut is made
band by band from the back.

| tier | props drawn | dropped |
| --- | --- | --- |
| high | 11 | — |
| medium | 11 | — |
| low | 5 | axe, bale, stacked crate, cask, sacks, wheel, second tent |
| fallback | 0 | the illustrated camp has no 3D anything |

`low` keeps the fire ring, the bucket, the crate and the barrel — the objects
that make the working end of the camp read as one place. A visitor on a weaker
machine is looking at the same camp from the same seat; there is less of the
dressing.

---

## Performance

Measured in the development overlay (§38), at 1000 × 1500, dpr 2.

| | before | after |
| --- | --- | --- |
| draw calls, at rest | 114 | **128** |
| triangles, at rest | 21,991 | **42,757** |
| geometries | 114 | 125 |
| textures | 20 / 32.0 MB | 21 / **33.3 MB** |
| programs | 16 | 21 |
| shipped model bytes | 0 | **665 kB** |

Triangles roughly double and textures rise by 1.3 MB — the props share the
Camp's existing procedural timber rather than bringing maps of their own, which
is most of why that number is small.

Fourteen draw calls for eleven props across sixteen placements: repeats are
instanced (§20), so two supply crates are one call and adding a third would
cost a matrix.

The `frustumCulled = false` on each instanced mesh is deliberate — the matrices
are written once and never move, and the camera cannot leave its box, so
per-frame culling would be spending work to discover a fixed answer.

---

## Loading

The GLB is fetched when the Camp scene mounts and not before (§18). It sits
behind its own `<Suspense>` inside the near-field group, so the scene appears
and the supplies arrive into it — §37 asks that loading feel intentional and
that nothing freeze waiting on a background asset, and a camp that fills up is
a better answer than a camp that will not appear until its barrels have
downloaded.

Disposal goes through the same path as everything else: `releaseScene` walks
the scene at teardown and the instanced meshes and their six shared materials
go with it. See `components/three/README.md`.
