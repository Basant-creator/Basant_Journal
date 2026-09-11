# THE FRONTIER — Design Direction

**Basant Bhushan · Personal Portfolio · Phase 1**
Single visual source of truth. Every later phase resolves disagreements against this document.

| | |
|---|---|
| Token implementation | [`design/tokens.css`](../design/tokens.css) |
| Shared content model | [`content/portfolio.json`](../content/portfolio.json) |
| Visual spec (live) | Published artifact — palette, type specimen, map, wireframes, components |

---

## 0. How to use this document

Three rules govern everything below.

1. **Tokens are law.** No component invents a colour, spacing value, radius, shadow, duration or easing. If a component needs something the token file does not have, the token file gets amended — the component does not get an exception.
2. **Content lives in one place.** `content/portfolio.json` is the only source of facts. The creative renderer and the professional renderer both read it. A fact that is not in that file does not appear on the site in either mode.
3. **The metaphor serves the engineering.** Where atmosphere and technical clarity conflict, technical clarity wins, every time. This is not a negotiable trade-off — it is the difference between the two outcomes named in §14.

---

## 1. Final visual concept

### The concept in one line

> **The Frontier is a surveyor's record of territory still being mapped.**

### Why "surveyor" and not "cowboy"

This is the single most important decision in the document, and it is what keeps the portfolio out of fan-page territory.

The frontier genre contains two very different figures. One is the outlaw — guns, saloons, wanted posters, the stuff of memes. The other is the **surveyor and field naturalist** — the person who arrived with instruments, walked the ground, measured it, drew it, and wrote down what they found. Both are period-accurate. Only one of them is about rigour, observation, measurement and documentation.

Basant is the second figure. The portfolio is his survey.

Every consequence falls out of that choice:

| Because the figure is a surveyor | The site therefore |
|---|---|
| Surveyors measure | Makes `157K+ tracks/sec` and `99.7%` the emotional climax, not decoration |
| Surveyors annotate | Uses handwriting for margins and corrections, never for headlines |
| Surveyors draw maps | Earns the map as navigation rather than bolting it on as a gimmick |
| Surveyors keep field journals | Makes long technical write-ups the *native* content type, not an interruption |
| Surveyors have no use for guns | Removes the entire category of cowboy cliché without needing a rule against it |

The framing device is a bound survey record: **THE FRONTIER — Volume I, a survey of territory still being mapped.** Sections are locations on the surveyed ground. Projects are chapters of the field journal. Results are measurements. The résumé is the copy filed at the archive.

"Territory still being mapped" also quietly does honest work: Basant is a third-year student. The site does not need to pretend to a decade of shipped production systems. The frontier is *unfinished by definition* — and that reframes a student portfolio's real weakness as the concept's central strength.

### The three-layer model

The whole visual system reduces to three layers. Every component belongs to exactly one.

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 2 — THE HAND        red ink · handwriting · pins · rules  │  ~3% of pixels
│                            marks attention, never carries content │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 1 — THE PAPER       journals · documents · cards · maps    │  ~35%
│                            all long-form reading happens here     │
├──────────────────────────────────────────────────────────────────┤
│  LAYER 0 — THE DARK        ink ground · vignette · grain · map    │  ~62%
│                            distance, atmosphere, navigation       │
└──────────────────────────────────────────────────────────────────┘
```

Three enforceable rules come from it:

- **Long-form content never floats on the dark.** If there is a paragraph to read, it sits on paper. The dark holds titles, metrics, the map, and navigation — nothing that requires sustained reading.
- **Red is Layer 2 only.** Never a background field, never a section wash, never more than roughly 3% of any viewport. It marks the active trail, the primary action, and the annotation rule. That is the complete list.
- **Handwriting is Layer 2 only.** Marginalia and labels. Never body, never navigation, never a heading.

The model is what prevents the design from drifting into "dark theme with a sepia filter." The contrast between cold dark and warm paper *is* the atmosphere; texture and colour only reinforce it.

### The emotional sequence

```
Curiosity  →  Exploration  →  Discovery  →  Technical credibility  →  Professional confidence
  Landing       The map       The journal      The bounties           The archive / pro view
```

The design's job is to hand the visitor off cleanly between those five states. The most common failure mode for a portfolio like this is arriving at "Exploration" and never reaching "Technical credibility" — the atmosphere is enjoyed and the engineering is never read. §12 (navigation) and §10 (homepage) are both designed against that specific failure.

---

## 2. Moodboard direction

Six references, described so they can be sourced or generated without ambiguity. **All final assets are original or generated for this portfolio** — these are direction, not assets.

1. **1880s US Geological Survey field maps.** Hand-drawn hachures and contour lines, sparse annotation in a small engraved capital, wide unprinted margins. This is the map's primary reference — note how little ink is on the page, and how much of the drawing is empty paper.
2. **A naturalist's field journal spread.** Pressed-flat binding, a printed body column with handwritten corrections in the margin in a different ink colour. This is the journal-entry layout reference, and the justification for `--font-hand` existing at all.
3. **Wet-plate collodion landscape photography.** Warm grey-brown tonality, blown highlights, soft vignette from the lens, physical plate defects at the edges. Reference for photographic treatment (§7) — *not* for colour grading the UI, which stays cooler and darker than a collodion plate.
4. **Letterpress broadsheet.** Heavy condensed display capitals, thin ink rules dividing columns, tight dense body text with generous outer margins. Reference for the professional/newspaper view (§16).
5. **An engraver's symbol sheet.** Small monochrome line glyphs — tents, roofs, trees, tools — drawn at one stroke weight, slightly irregular, readable at 16px. Reference for the icon and map-symbol system (§8).
6. **Night camp, single light source.** A small warm pool of light with the landscape falling into darkness beyond it. This is the *lighting* reference for the whole site: one warm focal surface, deep falloff. It is why the vignette and the paper surfaces do the work they do.

**Explicitly not on the moodboard:** game screenshots, game menus, in-game HUD, wanted posters as UI, revolver or whiskey iconography, saloon-font display type, any leather/wood skeuomorphic panel texture.

---

## 3. Colour system & contrast audit

The palette is implemented in [`design/tokens.css`](../design/tokens.css). This section documents **what each colour is for** and **what it may not do** — a hex list alone is not a system.

### Core palette

| Token | Value | Layer | Role |
|---|---|---|---|
| `--color-ink` | `#1B1713` | 0 | Global background. The dark. |
| `--color-ink-soft` | `#2A231D` | 0 | Raised dark surfaces, nav bar, modal ground |
| `--color-paper` | `#D8C7A5` | 1 | The default document surface |
| `--color-paper-light` | `#E7D9BC` | 1 | Highlighted paper, metric numerals, focus ring on dark |
| `--color-paper-dark` | `#B7A27D` | 1 | Recessed paper, map nodes at rest |
| `--color-earth` | `#66503A` | 1 | Secondary text **on paper**, at ≥16px only |
| `--color-earth-dark` | `#403225` | 1 | Small text and rules on paper |
| `--color-red` | `#7A2E2E` | 2 | Primary action fill, active trail, annotation rule |
| `--color-red-light` | `#A65145` | 2 | Active map line, large display accent |
| `--color-red-hover` | `#8E3A35` | 2 | **Added in Phase 1** — see audit below |
| `--color-dust` | `#9B8565` | 0 | Particle and haze tinting |
| `--color-smoke` | `#746B5D` | 0 | Water, distant terrain |
| `--color-border` | `#806D50` | 0/1 | Map line, document rules |
| `--color-muted` | `#A49476` | 0 | Metadata labels on dark |
| `--color-white-warm` | `#F2E9D7` | 0 | Primary text on dark |

### Contrast audit

Measured, not estimated. WCAG 2.1 thresholds: **4.5:1** normal text, **3:1** large text (≥24px, or ≥19px bold) and non-text graphics.

| Foreground | Background | Ratio | Verdict |
|---|---|---|---|
| `--color-white-warm` | `--color-ink` | **14.8:1** | AAA — primary body on dark |
| `--color-text-secondary` `#C6B99F` | `--color-ink` | **9.2:1** | AAA |
| `--color-muted` | `--color-ink` | **6.0:1** | AA at any size |
| `--color-muted` | `--color-ink-soft` | **5.2:1** | AA at any size |
| `--color-ink` | `--color-paper` | **10.7:1** | AAA — editorial body on paper |
| `--color-earth-dark` | `--color-paper` | **7.4:1** | AAA |
| `--color-earth` | `--color-paper` | **4.55:1** | AA, **≥16px only** |
| `--color-white-warm` | `--color-red` (button) | **7.7:1** | AAA — primary button is safe |
| `--color-white-warm` | `--color-red-light` (button) | **4.48:1** | ❌ **FAILS AA** |
| `--color-white-warm` | `--color-red-hover` `#8E3A35` | **6.2:1** | AA — the corrective |
| `--color-red-light` as text | `--color-ink` | **3.3:1** | Large display and graphics only |
| `--color-red` as text | `--color-ink` | **1.9:1** | ❌ Never |
| `--map-line` `#806D50` | `--color-ink` | **3.58:1** | Passes the 3:1 graphics bar |
| `--map-line-muted` | `--color-ink` | **1.95:1** | Decorative only — see below |
| `--color-paper-light` (focus ring) | `--color-ink` | **12.8:1** | Strong |
| `--color-paper-light` (focus ring) | `--color-paper` | **1.19:1** | ❌ Invisible — see below |

### Three findings that change the spec

**1. `--color-red-light` fails as a button fill.** At 4.48:1 under warm-white text it misses AA by 0.02. The token file adds `--color-red-hover: #8E3A35` (6.2:1) as the hover fill, and `--color-accent-hover` now points at it. `--color-red-light` keeps its job as a *line and large-display* accent, where the 3:1 bar applies and it passes comfortably.

**2. The focus ring cannot be one colour.** Paper-light is 12.8:1 on the dark shell and 1.19:1 on a paper card — literally invisible on exactly the surfaces holding the most content. `--focus-ring-color` is therefore surface-scoped: paper-light on `.surface-dark`, ink on `.surface-paper`. This is handled in the token file; components must not override it.

**3. Inactive trails cannot carry meaning.** `--map-line-muted` at 1.95:1 is below every threshold. It is fine as atmosphere, but an untravelled trail must never be the only signal that something is interactive. The *node* carries the affordance — nodes are drawn at `--map-line` or brighter, which clears 3:1.

### Prohibitions

- No saturated modern UI colour. No electric blue, neon purple, bright green, or any hue outside the warm ink/paper/earth/red family.
- No pure `#000` and no pure `#FFF`, anywhere, including shadows and overlays — shadow tokens use `rgba(0,0,0,…)` at low alpha against a warm ground, which reads as depth rather than as black.
- Red is never a background field, section wash, or large fill. Budget: ≤3% of any viewport.
- Success/warning/error states, if ever needed, are drawn from the existing palette plus an *icon and label* — never a new hue. No information is conveyed by colour alone (§14).

---

## 4. Typography system

Four roles, strictly separated. The separation is what makes the site read as designed rather than decorated.

| Role | Token | Face | Used for | Never used for |
|---|---|---|---|---|
| Display | `--font-display` | Cinzel → IM Fell English SC | Chapter titles, location names, project names, map labels, metric numerals | Body, UI, anything over ~6 words |
| Editorial | `--font-editorial` | Source Serif 4 | Journal entries, project write-ups, biography — all sustained reading | Buttons, nav, metadata |
| Interface | `--font-ui` | Inter | Nav, buttons, metadata, tech tags, dates, small numbers | Long-form body |
| Hand | `--font-hand` | Caveat | Margin annotations, decorative labels, a signature | Body, navigation, headings, anything load-bearing |

### Two refinements to the brief

**The wordmark should be drawn, not set.** `THE FRONTIER` appearing in a Google Font undercuts the "handcrafted" quality bar and is the one place a visitor looks hardest. It should be **original SVG lettering** — condensed frontier capitals with slight baseline irregularity and one deliberate imperfection, ~18KB inline, animatable as a stroke-draw on first load. This also permanently sidesteps the "exact game fonts" risk in §15: the identity type is Basant's own artwork and cannot resemble anyone's licensed asset.

**Cinzel is a placeholder worth testing against.** Cinzel is Roman inscriptional — it reads *classical/luxury*, closer to a perfume campaign than a frontier survey. Two alternatives to compare during Phase 2, both free: **IM Fell English SC** (genuinely period, 17th-century Fell types, has the ink-spread irregularity the concept wants) and a condensed slab in the **Zilla Slab / Bitter** family (closer to letterpress broadsheet, and stronger for the professional view). The token name does not change — only its value. Decide once, in the browser, at real sizes.

Cinzel also has no true lowercase texture, so long strings shout. Hard cap: **display type is used at six words or fewer.** Project subtitles like *"Algorithmic Music Flow Sequencer & Energy Optimizer"* are editorial, not display.

### Scale and the tokens the brief was missing

The type scale is as specified (`--text-xs` … `--text-hero`). Phase 1 adds the three token families whose absence is where type systems usually leak:

- **Leading** — `--leading-tight` 1.06 (display) · `--leading-snug` 1.22 (headings) · `--leading-normal` 1.45 (UI) · `--leading-relaxed` 1.68 (editorial body on paper)
- **Tracking** — `--tracking-tight` −0.02em (large display) · `--tracking-wide` 0.06em (buttons) · `--tracking-label` 0.08em (metadata) · `--tracking-hero` 0.14em (eyebrows, map labels)
- **Measure** — `--measure-prose` 66ch (journal body) · `--measure-lede` 54ch (hero and section intros) · `--measure-note` 38ch (annotations)

Measure matters more than usual here. A serif at `--leading-relaxed` running the full width of a 1440px paper panel is unreadable regardless of how good the texture is.

### Applied pairings

| Element | Font | Size | Leading | Tracking | Colour |
|---|---|---|---|---|---|
| Wordmark | Custom SVG | `--text-hero` | — | — | `--color-white-warm` |
| Name (landing) | display | `--text-4xl` | tight | `--tracking-tight` | `--color-white-warm` |
| Chapter title | display | `--text-3xl` | tight | normal | `--color-paper-light` |
| Section heading | display | `--text-2xl` | snug | normal | `--color-text-primary` |
| Project name | display | `--text-xl` | snug | normal | context |
| Journal body | editorial | `--text-md` | relaxed | normal | `--color-text-on-paper` |
| Hero lede | editorial | `--text-lg` | 1.5 | normal | `--color-text-secondary` |
| Metadata label | ui | `--text-xs` | normal | `--tracking-label`, uppercase | `--color-muted` |
| Tech tag | ui | `--text-xs` | normal | `--tracking-wide` | contextual |
| Button | ui 600 | `--text-sm` | normal | `--tracking-wide` | contextual |
| Bounty numeral | display | `--text-3xl`/`4xl` | tight | `--tracking-tight` | `--color-paper-light` |
| Annotation | hand | `--text-lg` | 1.3 | normal | `--color-red-light` on dark / `--color-red` on paper |

Body text never goes below **16px** on any breakpoint. Metadata at `--text-xs` (11.5px) is permitted only for genuinely secondary labels, at ≥6.0:1 contrast, and never as the sole carrier of information.

---

## 5. Spacing & layout system

4px base, as specified. Phase 1 makes the layout rhythm **fluid** so the cinematic scale survives the breakpoints instead of stepping down at them:

```css
--page-pad:      clamp(20px, 5vw, 96px);
--section-gap:   clamp(96px, 12vw, 160px);
--narrative-gap: clamp(48px, 6vw, 80px);
--card-pad:      clamp(24px, 3vw, 32px);
```

| Context | Value |
|---|---|
| Page padding — desktop | 64–96px |
| Page padding — tablet | 40–64px |
| Page padding — mobile | 20–24px |
| Between sections | 96–160px |
| Card interior | 24–32px |
| Component gaps | 8–16px |
| Narrative gaps | 48–80px |

Grid: **12 columns** desktop, **8** tablet, **4** mobile. `--grid-gutter: 24px`. `--container-max: 1440px`, `--content-max: 1180px`.

**The whitespace is load-bearing.** The single most likely way this design fails in implementation is a section being tightened to "fit more in." Emptiness is what makes the paper surfaces read as objects placed on a table rather than as panels in a layout. If a section feels too sparse in isolation, it is probably correct in sequence.

---

## 6. Border, radius & shadow system

**Borders.** Document rules, not UI chrome. `--border-paper` (1px, warm ink at 35%) for document edges; `--border-paper-strong` for emphasised documents; `--border-dark` / `--border-dark-strong` for divisions on the dark shell; `--rule-ink` for editorial hairlines between blocks; `--rule-hand` (2px, red at 55%) for the annotation rule only. No glassmorphism, no blurred translucent panels, no gradient borders.

**Radius.** The site is document-like, not app-like.

| Element | Radius |
|---|---|
| Journal pages, documents, paper panels | `--radius-none` – `--radius-sm` |
| Image and photo cards | `--radius-sm` – `--radius-lg` |
| Buttons | `--radius-md` (4px) |
| Tags | `--radius-sm`; `--radius-pill` only where genuinely useful |
| Anything | **Never** 20–32px |

**Shadows.** Physical paper depth, never UI elevation. `--shadow-paper` for a document resting on the table; `--shadow-paper-deep` for the active or opened document; `--shadow-paper-lift` on hover; `--shadow-inset` for the faint interior darkening that makes paper read as slightly cupped rather than flat.

Shadow rules: at most **two** elevated surfaces visible at once. Shadows are always warm-neutral black at low alpha, never coloured. Hover moves paper up by `--lift-sm`/`--lift-md` (2–4px) and deepens the shadow — it never scales it.

---

## 7. Texture strategy

Five layers, all subtle enough to be **felt before they are noticed**. Every one is pointer-events-none and none may ever reduce text contrast below the §3 thresholds.

| Layer | Opacity | Scope | Implementation |
|---|---|---|---|
| Film grain | `0.04` | Global, fixed | `--texture-grain-url` — SVG `feTurbulence`, baseFrequency 0.82, 3 octaves, desaturated. 240px tile. |
| Paper fibre | `0.08` | Paper surfaces only | `--texture-paper-url` — baseFrequency 0.045, 5 octaves. `mix-blend-mode: multiply`. 420px tile. |
| Vignette | `0.22` | Global, fixed | `--texture-vignette` — radial gradient, transparent to 38%, warm black at edge |
| Dust | `0.04` | Hero and map only | Canvas, ≤40 particles, ≤0.3px/frame drift |
| Ink imperfection | — | Per component | SVG paths: slight stroke irregularity, occasional break in a rule, a faint press-mark at a document corner |

### Implementation rules

- **One grain element for the whole document**, `position: fixed`, `z-index: var(--z-texture)`, above content and below navigation. Not a per-component pseudo-element — dozens of separate turbulence layers is the fastest way to make the site feel slow.
- **Generate turbulence once, not per frame.** The SVG filter rasterises to a tile; it must never animate.
- **Dust is the only moving texture**, and it is the first thing removed — off under `prefers-reduced-motion` (the token file zeroes `--texture-dust-opacity`), off below 768px, off when the tab is hidden.
- **Photography** gets its own treatment, not the global one: desaturate to ~15%, warm-tone toward `--color-dust`, slight inner vignette, and a subtle paper-coloured border to read as a mounted print. Applied at build time where possible.
- **Performance budget:** total texture cost under 16ms of main-thread work on first paint, and zero continuous main-thread work when dust is off.

### The readability test

Before any texture ships, screenshot the densest journal page and run it through a contrast checker at the exact pixel values. If `--color-earth` on `--color-paper` drops below 4.5:1 once the fibre layer multiplies over it, the fibre opacity comes down — not the text colour up. Texture yields to legibility, always.

---

## 8. Map visual language

The map is the primary navigation metaphor and the highest-risk element in the design. It has to be *readable as navigation* by someone who has never seen it before, within about two seconds.

### Canvas and terrain

Single SVG, `viewBox="0 0 1600 1000"`, scaling fluidly. Drawn in three depths:

1. **Terrain (deepest)** — `--map-terrain` at 30% alpha. A mountain range across the upper third in hachure strokes, contour rings around the high ground, sparse hatching for scrub near the lower-left, a river in `--map-water` running upper-left to lower-right past Town.
2. **Trails (middle)** — `--map-line-muted`, `--map-stroke-medium`, dashed `6 7` for untravelled segments; solid `--map-line` for travelled ones; `--map-line-active` at `--map-stroke-major` for the segment under focus.
3. **Locations (top)** — node markers and labels, always at or above `--map-line` brightness.

The composition reads left-to-right as a journey: arrival at the lower-left, the horizon and high ground to the upper-right.

### The seven locations

| Location | Section | Coord | Symbol |
|---|---|---|---|
| Camp | About | `300, 700` | Tent triangle with a curl of smoke |
| Gear | Skills | `470, 430` | Folded tool roll, three tool ends showing |
| Journal | Projects | `760, 470` | Open book, two leaves, a ribbon |
| Bounties | Results | `1030, 250` | Nailed notice board, one corner curled |
| Town | Education | `1180, 640` | Three roof silhouettes and a flagpole |
| Archive | Resume | `1330, 520` | Bound sheaf of papers with a seal |
| Trail End | Contact | `1470, 830` | Signpost at a fork |

Trail order: `Camp → Gear → Journal → Bounties → Town → Archive → Trail End`, plus one direct `Camp → Journal` shortcut, because Journal is the destination most visitors actually want and the map should admit that.

Journal is drawn at **1.4× the node size of its neighbours**. Visual weight should follow importance to the visitor, not symmetry.

### Symbol drawing rules

- Monochrome line art, `--icon-stroke` 1.5px, round caps, no fills except the node dot.
- Slightly imperfect: hand-drawn irregularity in the path, never a mechanically perfect circle or a mechanically straight line.
- Legible at **16px** — test every glyph at that size before it ships.
- No detailed or realistic game-style assets. A tent is four strokes, not a rendered illustration.

### Node states — and the accessibility requirement they satisfy

Each state differs by **shape and fill**, not colour alone (§14):

| State | Ring | Fill | Label | Trail |
|---|---|---|---|---|
| Rest | 1px `--map-node` | none | 40% opacity | dashed muted |
| Hover | 2px `--map-node-live` | small `--map-node-live` dot | 100%, ink-on-paper plate | segment → `--map-line-active`, solid |
| Focus | 2px `--map-node-live` + `--focus-ring-color` outline at 3px offset | dot | 100% + plate | as hover |
| Visited | 1px `--map-line` | small dot | 70% | solid `--map-line` |
| Active | 2px `--map-line-active` | filled | 100% + plate | solid `--map-line-active` |

The label plate — a small paper rectangle behind the location name — is what makes labels readable over terrain lines. It is not decorative.

### Reveal choreography

On first arrival: terrain fades in over `--duration-reveal`; trails draw themselves via `stroke-dashoffset` over `--duration-cinematic`, staggered by `--stagger`, in trail order; nodes fade in behind their trail segment. Total under 2.4s, **fully skippable** — any click, key press, or scroll completes it immediately. Under reduced motion the whole map is simply present, fully drawn, at full opacity.

---

## 9. Component inventory

22 components. Every one consumes tokens; none carries hard-coded style.

| Component | Layer | Anatomy | Key tokens | States |
|---|---|---|---|---|
| `Map` | 0 | SVG canvas, terrain + trails + nodes, roving-tabindex group | `--map-*`, `--z-map` | loading · revealed · reduced-motion |
| `MapLocation` | 0 | Node marker, symbol, label plate, hit area ≥44px | `--map-node*`, `--icon-md` | rest · hover · focus · visited · active |
| `TrailLine` | 0 | SVG path, dash offset animation | `--map-line*`, `--map-dash` | untravelled · travelled · active |
| `Navigation` | — | Persistent bar: wordmark, 7 destinations, view toggle | `--nav-*`, `--z-navigation` | top · condensed · drawer (mobile) |
| `SectionHeader` | 0 | Chapter numeral, display title, rule, lede | `--font-display`, `--rule-ink` | default · sticky |
| `PaperPanel` | 1 | Paper surface, fibre texture, border, shadow | `--paper-*` | rest · hover-lift · opened |
| `JournalEntry` | 1 | Date, chapter, editorial body at `--measure-prose`, marginalia slot | `--font-editorial`, `--leading-relaxed` | collapsed · expanded |
| `ProjectCard` | 1 | Chapter numeral, name, subtitle, summary, 3 metrics, tags, links | `--paper-*`, `--tag-*` | rest · hover · focus |
| `ProjectMetric` | 1 | Value + unit + label, inline in a project | `--metric-*` | default |
| `SkillGroup` | 1 | Group label, rule, item list | `--label-*`, `--rule-ink` | default |
| `SkillItem` | 1 | Name + linked-project indicators | `--tag-*` | default · linked · hover |
| `BountyMetric` | 0 | Large display numeral, unit, label, source project | `--metric-*` | rest · counted-up |
| `TimelineNode` | 1 | Year, title, body, connector rule | `--rule-ink` | default · current |
| `DocumentCard` | 1 | Certificate/credential: title, issuer, date, seal mark | `--paper-*` | rest · hover |
| `PhotoFrame` | 1 | Treated image, paper mat, caption | `--radius-sm`, `--shadow-paper` | rest · loading |
| `Annotation` | 2 | Handwritten note, optional leader line to its target | `--font-hand`, `--rule-hand`, `--measure-note` | default |
| `PrimaryButton` | 2 | Red fill, warm-white label | `--btn-primary-*` | rest · hover · active · focus · disabled |
| `SecondaryButton` | 0/1 | Transparent, bordered | `--btn-secondary-*` | rest · hover · active · focus · disabled |
| `Tag` | 1 | Tech label, optional project link | `--tag-*` | rest · interactive · hover |
| `Modal` | — | Scrim, paper document, close affordance, focus trap | `--modal-*`, `--z-modal` | closed · opening · open |
| `ProfessionalViewToggle` | — | Persistent mode switch, `aria-pressed` | `--btn-secondary-*` | creative · professional |
| `TextureLayer` | — | Fixed grain + vignette, pointer-events-none | `--texture-*`, `--z-texture` | on · reduced |

Every interactive component must define all five of: **rest, hover, focus-visible, active, disabled**. A component missing a focus-visible state is not finished.

---

## 10. Homepage composition

### Wireframe — desktop, 12 columns

```
┌────────────────────────────────────────────────────────────────────────┐
│ ◇ THE FRONTIER            CAMP JOURNAL GEAR BOUNTIES …  [PRO VIEW] │ z-100
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│      ╱╲   ╱╲╲  ╱╲     ← distant range, --map-terrain @ 30%        │ z-20
│   ╱╲╱  ╲╱╱  ╲╱  ╲╲       topographic contours, very faint          │
│                                                                        │
│   col 1 ─────────────────────── col 8 ──────────── col 12            │
│                                                                        │
│   VOLUME I · A SURVEY            ← eyebrow, ui xs, tracking-hero       │ z-10
│                                                                        │
│   ████████ ███ ████████████                                           │
│   T H E   F R O N T I E R        ← custom SVG wordmark, --text-hero    │
│                                                                        │
│   BASANT BHUSHAN                 ← display, --text-2xl                 │
│   ──────────────                 ← 1px rule, --color-border-strong     │
│                                                                        │
│   Computer Science student building software,      ← editorial --lg    │
│   experimenting with AI, and exploring how far        max --measure-lede│
│   engineering ideas can be pushed.                                     │
│                                                                        │
│   ┌──────────────────────┐   ┌──────────────────────┐                 │
│   │  ENTER THE FRONTIER  │   │   PROFESSIONAL VIEW  │                 │
│   └──────────────────────┘   └──────────────────────┘                 │
│      primary, red fill          secondary, bordered                    │
│                                                                        │
│                                              ↓ scroll indicator        │
│         [ vignette 0.22 · grain 0.04 · ≤40 dust particles ]           │ z-40
└────────────────────────────────────────────────────────────────────────┘
```

Content occupies columns 1–8 with a hard 54ch measure; columns 9–12 stay empty so the terrain behind can breathe. The name sits at roughly 45% viewport height, on the upper third-line rather than dead centre.

**What is deliberately absent from the first screen:** the map itself (it belongs to the next scene), project cards, metrics, any social icon row, any loading screen. The first screen carries the concept, the name, one sentence, and two doors. That is the whole job.

### Both doors are equal

`ENTER THE FRONTIER` and `PROFESSIONAL VIEW` sit side by side at the same size. The professional view is not a fallback, an escape hatch, or an apology — it is a peer entrance, and recruiters arriving with 40 seconds should be able to take it without feeling they missed the point. Making it visually subordinate would be the single most self-defeating decision available on this page.

### Scroll behaviour

Landing → map is **scroll-driven, not a route change**: the hero copy lifts and fades over `--duration-cinematic` while the map reveals beneath it (§8). One scene becoming the next. A hard page transition here would break the sense of a continuous world; a full-screen loader would break it worse.

---

## 11. Responsive behaviour

| | Desktop ≥1200px | Tablet 768–1199px | Mobile <768px |
|---|---|---|---|
| Grid | 12 col | 8 col | 4 col |
| Page padding | 64–96px | 40–64px | 20–24px |
| Map | Full interactive SVG, primary navigation | Simplified: terrain reduced, labels always on, trails static | **Replaced**, not shrunk — see below |
| Hero | `--text-hero` | clamp mid | ~4rem floor |
| Nav | Inline, 7 destinations | Inline, condensed | Drawer |
| Dust | On | On | **Off** |
| Texture layers | All 5 | All 5 | Grain + vignette + paper only |
| Project layout | 2-up asymmetric | 2-up even | 1-up stacked |
| Bounties | 4 across | 2×2 | 2×2, `--text-3xl` |

### The mobile map

A 1600×1000 map scaled to 375px is unreadable and untappable. Mobile does not get a smaller map — it gets **a different representation of the same journey**:

- A vertical trail runs down the left gutter as a single hand-drawn line.
- Each of the seven locations is a **stacked paper card** attached to that trail: symbol, name, section label, one-line blurb.
- The trail line between cards uses the same dashed/solid travelled-state language, so the metaphor holds.
- A small non-interactive map thumbnail appears once at the top as an establishing shot, with `aria-hidden="true"` and no tap targets.

The narrative language is identical. The interaction model is native to the device. Scrolling a vertical trail of cards *is* still exploring the frontier — arguably more honestly than pinch-zooming an SVG.

**Touch targets are ≥44×44px everywhere**, including map nodes on tablet, where the visible marker may be smaller than its hit area.

---

## 12. Navigation model

### Two systems, always both available

1. **Spatial — the map.** The scenic route. Primary on desktop, the journey made visible.
2. **Linear — the persistent bar.** All seven destinations, always reachable, on every screen and in every mode.

**The map is never the only way to reach anything.** Someone who wants the projects immediately must be able to get there in one click from any point in the site, without walking the trail. The story is an offer, never a toll.

### Structure

```
/                 Landing → map
/camp             About
/gear             Skills
/journal          Projects index
/journal/:id      Project detail            (tuneit · onsight · bobai)
/bounties         Results
/town             Education & training
/archive          Résumé
/trail-end        Contact
/professional     Newspaper view (all sections, one page)
```

Real routes, real URLs, real browser history, deep-linkable and shareable. Back and forward behave correctly. A single-page scroll-hijacked experience would break all of that, and would break the recruiter's ability to send a colleague a link to one project.

### Keyboard model

- Map nodes form a single composite widget: **one tab stop**, arrow keys move between locations in trail order, Enter/Space travels, Escape returns focus to the persistent nav. Roving `tabindex`, `role="navigation"` with an accessible name.
- A **skip-to-content** link is the first focusable element on every page.
- Focus order follows visual order everywhere. Focus is never trapped outside a modal, and always trapped inside one.
- Focus-visible ring is 2px at 3px offset, colour scoped per surface (§3).

### Wayfinding

The visitor must always be able to answer *where am I* and *what is left*. The persistent bar marks the current location with `aria-current="page"` plus a visible mark (a small filled node, not colour alone). Section headers carry a chapter numeral. On desktop, a small collapsed map in the nav shows the current position as a lit node.

---

## 13. Animation principles

Motion communicates **arrival → exploration → discovery → transition**. Nothing animates to be impressive.

### Choreography

| Moment | Effect | Duration | Easing |
|---|---|---|---|
| First load | Wordmark stroke-draws, then copy fades up 12px | `--duration-reveal` | `--ease-cinematic` |
| Landing → map | Hero lifts and fades as terrain reveals | `--duration-cinematic` | `--ease-cinematic` |
| Trail drawing | `stroke-dashoffset` in trail order | `--duration-cinematic`, `--stagger` 70ms | `--ease-cinematic` |
| Node arrival | Fade + 6px rise, behind its trail segment | `--duration-slow` | `--ease-cinematic` |
| Journal opening | Paper scales 0.98→1, shadow deepens to `--shadow-paper-deep` | `--duration-normal` | `--ease-standard` |
| Section entry | Fade + 16px rise, once, on first view | `--duration-slow` | `--ease-cinematic` |
| Bounty numerals | Count up from 0, once per session | `--duration-cinematic` | `--ease-cinematic` |
| Hover — paper | Lift `--lift-md`, shadow to `--shadow-paper-lift` | `--duration-fast` | `--ease-standard` |
| Hover — button | Fill to `--color-accent-hover`, lift `--lift-sm` | `--duration-fast` | `--ease-standard` |
| Page transition | Outgoing fades to 0, incoming fades up 8px | `--duration-normal` | `--ease-standard` |

### The motion budget

- **At most two elements animate at once**, outside the single choreographed map reveal.
- **Entry animations run once.** Re-scrolling past a section does not replay it. Nothing re-animates on every viewport entry.
- **Nothing loops.** No floating cards, no pulsing nodes, no breathing glows. The only continuous motion on the site is dust, and dust is the first thing switched off.
- **Every reveal is skippable** — click, key, or scroll completes it immediately.
- **Content is never gated behind an animation.** Text is in the DOM and selectable before its reveal finishes. If JavaScript fails, everything is visible.
- **Transform and opacity only.** No animated layout, width, height, or filter.

### Forbidden

Bounce and spring-heavy easing. Aggressive zooms. Parallax beyond ~20px of travel. Particle bursts. Animated gradients. Typewriter effects on body copy. Loading screens of any kind — including a "cinematic" one.

### Reduced motion

Under `prefers-reduced-motion: reduce`, every duration token collapses to 1ms and dust opacity goes to 0 (handled in `tokens.css`). Crucially, **reveals become instant-and-present, not absent**: opacity lands at 1, transforms are removed, nothing disappears. The map is simply already drawn. The site must still feel deliberate and composed with every animation off — if it only works animated, the composition is wrong.

---

## 14. Accessibility rules

Non-negotiable, and checked before any phase is called complete.

**Contrast.** Every pairing in §3 is measured, not assumed. Body ≥4.5:1, large text and graphics ≥3:1. Texture layers must not push any pairing below threshold (§7 readability test).

**Colour is never the only signal.** Map node states differ by shape and fill as well as colour. The current nav item carries a mark and `aria-current`, not just a tint. Travelled trails differ by dash pattern, not only brightness. Verify by viewing the site in greyscale — every state must still be distinguishable.

**Keyboard.** Everything operable by mouse is operable by keyboard. Skip link first. Focus-visible on every interactive element, surface-scoped so it is visible on both dark and paper. Modals trap focus and restore it on close. Map is a single composite widget with arrow-key traversal.

**Semantics.** Real landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, no heading levels skipped. The map is `role="navigation"` with an accessible name; its nodes are links, not clickable `div`s. Buttons that act are `button`; things that navigate are `a`.

**Alt text.** Every meaningful image described. Decorative terrain, texture layers and the mobile map thumbnail are `aria-hidden="true"` with empty alt. Bounty metrics are real text, never images.

**Motion.** Full `prefers-reduced-motion` support (§13). No animation ever blocks navigation or delays content availability.

**Text.** Body ≥16px on all breakpoints. Layout survives 200% zoom and 400% text-only zoom with no loss of content or function. No text baked into images.

**Forms** (contact). Visible persistent labels, never placeholder-only. Errors announced via `aria-live`, described in text as well as colour, and tied to their field with `aria-describedby`.

**Target size.** ≥44×44px for every interactive element on touch, hit area independent of visual size.

---

## 15. Inspiration boundary — what is borrowed and what is not

The design borrows a **genre and an atmosphere**, both of which long predate any game and belong to no one. It borrows nothing that any company owns.

### Borrowed — the genre

Aged survey maps · hand-drawn cartography · frontier and letterpress typography · field journals · campfire and camp imagery · sepia and collodion photography · dusty landscapes · worn paper · exploration as structure · chapter-based storytelling · muted earth palettes.

All of this is 19th-century visual culture in the public domain, plus the western genre generally. None of it is anyone's IP.

### Not borrowed — the product

Rockstar or RDR2 logos, wordmarks, or brand identity · the game's UI, menus, or HUD · its exact typefaces · Arthur Morgan, Dutch, the Van der Linde gang, or any character, place or faction name · screenshots or recognisable in-game locations · copied layouts or interaction patterns from the game · any extracted or traced game asset.

### Operating rules

1. **Every asset is original or generated for this portfolio.** No ripped textures, no traced map fragments, no downloaded game imagery — including as a "temporary placeholder," because temporary placeholders ship.
2. **No proper nouns from the game.** Not in copy, not in alt text, not in file names, not in commit messages.
3. **The wordmark is drawn, not set** (§4) — which makes the identity type provably Basant's own.
4. **No cowboy comedy.** No gun, whiskey, horse or saloon iconography. No "howdy," no "partner," no wanted-poster jokes. The surveyor framing (§1) makes all of this simply irrelevant rather than forbidden.
5. **Names describe function.** Camp, Journal, Gear, Bounties, Town, Archive, Trail End are generic frontier nouns that describe what each section *is*. They would work in a portfolio by someone who had never played the game — which is the point.

### The two tests

**The stranger test.** Show the site to someone who has never played RDR2. They should find it atmospheric, coherent and well-made, with no sense of missing a reference. If any element only makes sense as a reference, it is a fan-site element and it goes.

**The takedown test.** If Rockstar's legal team looked at this, would there be anything to point at? There must be nothing — no asset, no mark, no character, no copied interface. Atmosphere is not ownable. Assets are.

---

## 16. Content model & the professional view

### One source, two renderers

```
                  content/portfolio.json
                   (the only source of facts)
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   Creative renderer                Professional renderer
   map · journal · camp             newspaper · single page
   Layer 0 dominant                 Layer 1 dominant
```

Both read the same file. Neither owns content. A new project is added once, in JSON, and appears correctly in both modes. **There is no second copy of the content, ever** — a forked content model is how these dual-mode sites rot within a month.

Fields carry presentation hints where the two modes legitimately differ. `showDetailInCreativeView: false` on education entries is the example: CGPA belongs in the résumé and the professional view, where a recruiter expects to find it; it is not a headline number and the creative view does not lead with it. That is an editorial decision encoded in data, not a fork of the data.

### The newspaper view

The professional view **inverts the layer model**: paper becomes the field, dark becomes the accent. Same tokens, different dominance — which is why it reads as the same publication rather than a different website.

- Broadsheet masthead: name, role, contact line, résumé download — all visible without scrolling.
- Multi-column density with `--rule-ink` hairlines between columns.
- Every section on one page: About · Skills · Projects · Education · Certifications · Résumé · Contact.
- Full technical detail for each project — problem, architecture, stack, results — scannable in under a minute.
- Motion capped at `--duration-fast` fades. No map, no dust, no reveals, no scroll effects.
- A print stylesheet that produces a clean two-page document.

Reachable three ways: the landing-page button, the persistent toggle, and the deep link `/professional`. The choice persists in `localStorage`, and the toggle is present in both modes so nobody is ever stuck in the one they did not want.

---

## 17. Open decisions

Five things Phase 1 cannot settle alone. Flagging them now so they do not get decided by accident during implementation.

1. **Display face.** Cinzel is retained in the token as a placeholder. Compare against IM Fell English SC and a Zilla Slab/Bitter condensed slab in-browser at real sizes before Phase 2 ends (§4). Token name does not change; only its value.
2. **Live project links.** `content/portfolio.json` has empty `github` and `live` fields for all three projects. The CV cites GitHub for all three and a live deployment for TuneIt — those URLs are needed. **Every project card must link to running code**; the credibility argument in §1 depends on it.
3. **Photography.** The concept calls for at least one treated photograph (Camp, and ideally one per project). Decide whether to source original photography, generate it, or design around its absence — the layout supports a no-photograph variant, but it is weaker.
4. **Résumé file.** `/BasantBhushan_CV.pdf` is referenced by both modes. Confirm the served filename and where it lives.
5. **Bounty sourcing.** The four headline metrics are real and come from the CV. Each one should link to the project section that substantiates it, so a sceptical reader can follow the number to its explanation. Unlinked metrics read as marketing; linked ones read as evidence.
