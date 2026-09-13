/**
 * The camp, generated.
 *
 * Same discipline as the map: the scenery comes out of a seeded stream rather
 * than out of hand-typed path data, so the treeline can be re-tuned by
 * changing a number and the server and client draw the identical camp.
 *
 * Coordinate space is the scene: 1600 x 900.
 */

import { createRng, seedFrom } from "@/lib/map/rng";

export const CAMP_WIDTH = 1600;
export const CAMP_HEIGHT = 900;

export interface Tree {
  d: string;
  /** Depth band, 0 = furthest. Drives tone and parallax rate. */
  band: number;
}

/**
 * A conifer, drawn as three stacked skirts over a trunk. Four strokes at
 * distance, which is all a tree on a horizon ever needs to be.
 */
function conifer(x: number, baseY: number, height: number, width: number): string {
  const w = width / 2;
  const tiers = [0.42, 0.68, 1];
  const parts: string[] = [];

  tiers.forEach((tier, i) => {
    const top = baseY - height * (1 - i * 0.22);
    const bottom = baseY - height * (1 - tier) * 0.62;
    const spread = w * tier;
    parts.push(
      `M ${(x - spread).toFixed(1)} ${bottom.toFixed(1)} L ${x.toFixed(1)} ${top.toFixed(1)} L ${(x + spread).toFixed(1)} ${bottom.toFixed(1)} Z`,
    );
  });

  parts.push(
    `M ${(x - 1.6).toFixed(1)} ${baseY.toFixed(1)} h 3.2 v ${(-height * 0.16).toFixed(1)} h -3.2 Z`,
  );

  return parts.join(" ");
}

/** Three bands of treeline, thinning and shrinking with distance. */
export function buildTreeline(): Tree[] {
  const rng = createRng(seedFrom("camp-treeline"));
  const out: Tree[] = [];

  const bands = [
    { baseY: 540, count: 46, height: [26, 52], width: [16, 30] },
    { baseY: 566, count: 30, height: [40, 78], width: [24, 44] },
    { baseY: 598, count: 16, height: [62, 118], width: [36, 66] },
  ];

  bands.forEach((band, index) => {
    for (let i = 0; i < band.count; i += 1) {
      const x = rng.range(-60, CAMP_WIDTH + 60);
      // Thin the middle so the tent and fire are not crowded from behind.
      if (x > 240 && x < 900 && rng.chance(0.55)) continue;
      out.push({
        d: conifer(
          x,
          band.baseY + rng.jitter(6),
          rng.range(band.height[0], band.height[1]),
          rng.range(band.width[0], band.width[1]),
        ),
        band: index,
      });
    }
  });

  return out;
}

/** Sparse stars, brighter toward the top of the sky. */
export function buildStars(): { cx: number; cy: number; r: number; o: number }[] {
  const rng = createRng(seedFrom("camp-stars"));
  const out: { cx: number; cy: number; r: number; o: number }[] = [];

  for (let i = 0; i < 64; i += 1) {
    const cy = rng.range(20, 400);
    // Fade out toward the horizon, where the fire's light washes them away.
    const fade = 1 - (cy - 20) / 420;
    out.push({
      cx: Math.round(rng.range(0, CAMP_WIDTH)),
      cy: Math.round(cy),
      r: Math.round(rng.range(0.6, 1.7) * 10) / 10,
      o: Math.round(rng.range(0.18, 0.72) * fade * 100) / 100,
    });
  }

  return out;
}

/** Three columns of smoke leaving the fire, each drifting a little differently. */
export const SMOKE_PLUMES = [
  "M 646 520 q -26 -70 6 -132 q 30 -58 -4 -122 q -30 -56 10 -108",
  "M 662 524 q 22 -64 -8 -124 q -28 -56 14 -110",
  "M 634 522 q -34 -58 -4 -116 q 26 -50 -10 -96",
];


/**
 * Stones and tufts on the strip of ground between the treeline and the table.
 *
 * A narrow band — about sixty units — but it is the only thing that says the
 * camp is pitched on ground rather than floating in front of trees.
 */
export interface Scatter {
  d: string;
  kind: "stone" | "tuft";
}

export function buildGroundScatter(): Scatter[] {
  const rng = createRng(seedFrom("camp-ground"));
  const out: Scatter[] = [];

  for (let i = 0; i < 44; i += 1) {
    const x = rng.range(-40, CAMP_WIDTH + 40);
    const y = rng.range(596, 652);
    // Nothing under the fire: it is the brightest thing in the frame and
    // scattered pebbles across it read as dirt on the lens.
    if (x > 560 && x < 740) continue;

    if (rng.chance(0.45)) {
      const w = rng.range(4, 13);
      const h = w * rng.range(0.4, 0.62);
      out.push({
        kind: "stone",
        d:
          `M ${(x - w).toFixed(1)} ${y.toFixed(1)} ` +
          `q ${(w * 0.4).toFixed(1)} ${(-h * 1.7).toFixed(1)} ${(w * 2).toFixed(1)} 0 Z`,
      });
    } else {
      const h = rng.range(9, 22);
      const lean = rng.jitter(7);
      out.push({
        kind: "tuft",
        d:
          `M ${x.toFixed(1)} ${y.toFixed(1)} q ${(lean * 0.4).toFixed(1)} ${(-h * 0.7).toFixed(1)} ${lean.toFixed(1)} ${(-h).toFixed(1)}` +
          ` M ${x.toFixed(1)} ${y.toFixed(1)} q ${(-lean * 0.6).toFixed(1)} ${(-h * 0.6).toFixed(1)} ${(-lean * 1.3).toFixed(1)} ${(-h * 0.82).toFixed(1)}`,
      });
    }
  }

  return out;
}

export interface LoosePaper {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  rules: number;
}

/**
 * Loose sheets in the gaps between the four objects.
 *
 * Deliberately in the gaps and deliberately plain: a table with four things
 * on it and nothing else reads as an arrangement, and a table where paper has
 * accumulated reads as a table someone works at. They carry no content and
 * take no pointer events — that is what the four objects are for.
 */
export function buildLoosePapers(): LoosePaper[] {
  const rng = createRng(seedFrom("camp-papers"));
  const gaps = [96, 214, 596, 1196, 1520];

  return gaps.map((x) => ({
    x: Math.round(x + rng.jitter(26)),
    y: Math.round(rng.range(790, 860)),
    w: Math.round(rng.range(130, 190)),
    h: Math.round(rng.range(92, 126)),
    rotate: Math.round(rng.range(-13, 13) * 10) / 10,
    rules: Math.round(rng.range(2, 5)),
  }));
}

/**
 * Where each object sits on the table, in the scene's own coordinates.
 *
 * Centre and size, matching how the drawings are placed — every object is a
 * `translate(cx cy)` group with its parts hung off the origin. The previous
 * version of this stored percentages instead, and stored *centres* in fields
 * that were then used as `left` and `top`: every hit area sat half its own
 * width to the right of the thing it was labelling.
 *
 * Keeping one representation and deriving the other is what stops that
 * happening again. objectBox is the only place the conversion exists.
 */
export const CAMP_OBJECTS = {
  notebook: { cx: 392, cy: 786, w: 320, h: 190 },
  photograph: { cx: 760, cy: 806, w: 196, h: 168 },
  notes: { cx: 1032, cy: 780, w: 216, h: 168 },
  map: { cx: 1332, cy: 790, w: 244, h: 186 },
} as const;

export type CampObjectId = keyof typeof CAMP_OBJECTS;

/**
 * An object's box as shares of the stage, in SceneObject's shape.
 *
 * The one conversion between how the scene is drawn and how it is reached
 * into. Everything else — the drawing's own transform included — comes off
 * CAMP_OBJECTS directly, so the control and the object cannot be positioned
 * from two different sets of numbers.
 */
export function objectBox(id: CampObjectId): { x: number; y: number; w: number; h: number } {
  const o = CAMP_OBJECTS[id];
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return {
    x: round(((o.cx - o.w / 2) / CAMP_WIDTH) * 100),
    y: round(((o.cy - o.h / 2) / CAMP_HEIGHT) * 100),
    w: round((o.w / CAMP_WIDTH) * 100),
    h: round((o.h / CAMP_HEIGHT) * 100),
  };
}

/** Where an object's drawing is placed, and how it lies. */
export function objectTransform(id: CampObjectId, rotate: number): string {
  const o = CAMP_OBJECTS[id];
  return `translate(${o.cx} ${o.cy}) rotate(${rotate})`;
}

/* --- the land between the camp and the mountains -------------------------- */

export interface LandBand {
  /** Height above the ground at evenly spaced samples, left to right. */
  profile: number[];
  /** How far back it stands, in world metres. Negative is away. */
  z: number;
  /** How high the band rises at its tallest, in metres. */
  rise: number;
}

/**
 * Four bands of open country, receding.
 *
 * The gap this fills is the one the sky exposed: below the horizon the ground
 * was a flat dark expanse and between the camp and the mountains there was
 * nothing at all — which reads as a stage with a backdrop rather than as a
 * place with distance in it.
 *
 * Low and wide on purpose. These are not hills; they are the ground failing to
 * be flat, which is what open country actually looks like at dusk. The tallest
 * rises 1.6 metres against mountains that will crest at nine — if a band ever
 * competes with a ridge, the depth reads as two mountain ranges rather than as
 * land going away.
 *
 * Seeded, so the country is the same country on every visit and on every
 * machine, and rounded, because unrounded generated coordinates differ between
 * Node and the browser in the fifteenth decimal and React calls that a
 * hydration mismatch. That has bitten this codebase three times.
 */
export function buildLandBands(): LandBand[] {
  const rng = createRng(seedFrom("camp-land-bands"));
  const round = (n: number) => Math.round(n * 1000) / 1000;

  /*
    Rise grows with distance, and it has to.

    The first pass used 0.42 to 1.6 metres and rendered as four flat
    horizontal stripes — correct tones, no land. A band's relief is only
    visible as the angle it subtends, and 1.6 metres at fifty is about one
    degree of swing: a straight line with a colour change at it.

    These are sized so each band swings roughly three degrees from the
    camera, which is the point where an edge stops reading as a rule and
    starts reading as ground. They still top out at 4.6 against mountains
    that crest at 9.2 — a band that competes with a ridge turns depth into
    two mountain ranges.

    Nearer bands are sampled more finely: they are read, not glimpsed.
  */
  const bands = [
    { z: -7.5, rise: 1.1, steps: 40, roll: 2.1 },
    { z: -16, rise: 1.9, steps: 32, roll: 1.6 },
    { z: -27, rise: 2.8, steps: 26, roll: 1.25 },
    { z: -44, rise: 4.3, steps: 20, roll: 0.95 },
  ];

  return bands.map((band) => {
    /* Three waves at unrelated frequencies, so no band repeats itself across
       its own width and no two bands share a silhouette. */
    const a = rng.range(0, Math.PI * 2);
    const b = rng.range(0, Math.PI * 2);
    const c = rng.range(0, Math.PI * 2);

    const profile: number[] = [];
    for (let i = 0; i <= band.steps; i += 1) {
      const t = i / band.steps;
      const shape =
        Math.sin(t * Math.PI * band.roll + a) * 0.54 +
        Math.sin(t * Math.PI * band.roll * 2.7 + b) * 0.29 +
        Math.sin(t * Math.PI * band.roll * 6.3 + c) * 0.17;
      profile.push(round(Math.max(0, 0.45 + shape * 0.55) * band.rise));
    }

    return { profile, z: band.z, rise: band.rise };
  });
}

/* --- the tree line -------------------------------------------------------- */

export interface Conifer {
  x: number;
  z: number;
  height: number;
  radius: number;
  lean: number;
  /**
   * Which shape out of the library this one is.
   *
   * §11 asks for a handful of variants distributed deterministically rather
   * than thousands of unique objects, and this is the deterministic half.
   * The renderer owns what the shapes are; the world only decides who gets
   * which, and it decides it from the same seeded stream as everything else,
   * so the stand is identical in Node and in the browser.
   */
  variant: number;
}

/**
 * A stand of conifers along the edge of the near country.
 *
 * Thinned through the middle, exactly as the illustrated treeline is, so the
 * tent and the fire are not crowded from behind — a solid wall of trees turns
 * the camp into a diorama in a box.
 *
 * Positions carry a little depth of their own rather than sitting on one line.
 * A treeline is a band, not a fence, and the two read completely differently
 * once anything in front of them moves.
 */
/** How many tree shapes the renderer keeps. §11 asks for three to six. */
export const TREE_VARIANTS = 4;

export function buildTreeStand(count = 64, z = -12): Conifer[] {
  const rng = createRng(seedFrom("camp-tree-stand"));
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const out: Conifer[] = [];

  for (let i = 0; i < count; i += 1) {
    const x = rng.range(-46, 46);
    /* The gap the camp sits in. */
    if (x > -9 && x < 7 && rng.chance(0.72)) continue;

    out.push({
      x: round(x),
      z: round(z + rng.range(-3.4, 2.2)),
      height: round(rng.range(2.6, 5.8)),
      radius: round(rng.range(0.5, 1.05)),
      lean: round(rng.jitter(0.07)),
      variant: Math.floor(rng.range(0, TREE_VARIANTS)),
    });
  }

  return out;
}

/* --- what is scattered on the ground around the camp ---------------------- */

export interface Scattered {
  x: number;
  z: number;
  scale: number;
  turn: number;
  /** Which shape out of the library. See Conifer.variant. */
  variant: number;
}

/** §11 asks for three to five rock shapes and two to four shrub shapes. */
export const ROCK_VARIANTS = 4;
export const SHRUB_VARIANTS = 3;

/**
 * Grass tufts and stones around the camp.
 *
 * Denser toward the camera, because the foreground is what a frame is built
 * out of: something near and dark along the bottom edge is what stops a scene
 * looking like a painting held at arm's length. §4 asks for exactly that layer
 * and puts it last for the same reason.
 *
 * A clearing is kept around the fire and the table. Grass growing through the
 * middle of a campsite says nobody has been standing there, which is the one
 * thing this scene is trying not to say.
 */
export function buildCampScatter(
  seed: string,
  count: number,
  spread: { x: number; near: number; far: number },
  variants = 1,
): Scattered[] {
  const rng = createRng(seedFrom(seed));
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const out: Scattered[] = [];

  for (let i = 0; i < count; i += 1) {
    const x = rng.range(-spread.x, spread.x);
    /* Biased toward the camera: two samples, nearer wins. */
    const a = rng.range(spread.far, spread.near);
    const b = rng.range(spread.far, spread.near);
    const z = Math.max(a, b);

    /* The trodden ground: the fire at (-1.15, -0.35) and the table at
       (0.75, 1.85), each with room to stand. */
    const nearFire = Math.hypot(x + 1.15, z + 0.35) < 1.5;
    const nearTable = Math.hypot(x - 0.75, z - 1.85) < 1.4;
    if (nearFire || nearTable) continue;

    out.push({
      x: round(x),
      z: round(z),
      scale: round(rng.range(0.6, 1.45)),
      turn: round(rng.range(0, Math.PI)),
      variant: Math.floor(rng.range(0, variants)),
    });
  }

  return out;
}

/**
 * The photograph on the table, and how it is printed.
 *
 * §19 asks the photograph to be a real photograph. It is: the file is a
 * portrait of the person whose camp this is, and nothing here modifies it on
 * disk. What lives here is the *treatment*, because a modern colour snapshot
 * dropped into a blue-hour frontier reads as a screenshot of a different
 * website — and because the illustrated camp and the rendered camp both have
 * to apply the same one.
 *
 * That is the whole reason this is a constant rather than two nice-looking
 * filters. The two renderings are supposed to be the same place; the last
 * time a value like this lived in two files the illustrated camp sat at warm
 * dusk for two hours while the rendered one had already moved to blue hour.
 * A colour matrix is exactly the kind of number nobody re-checks by eye.
 *
 * The matrix is the sRGB form an SVG `feColorMatrix` takes: four rows of
 * `[r, g, b, a, offset]`. A plain sepia is the obvious move and the wrong
 * one — it gives a uniform brown belonging to no particular palette. These
 * rows pull the greens up under the reds and drop the blues hard, which
 * lands the print in this world's earth range, and the offsets raise the
 * black point because an aged print has no true black anywhere in it.
 */
export const CAMP_PRINT = {
  src: "/portrait/basant-small.jpg",
  /** The file, as it is on disk. */
  source: { w: 320, h: 400 },
  /** The window in the mount, in scene units. Landscape, off a portrait
      source, so something has to be cropped away. */
  window: { x: -70, y: -50, w: 140, h: 92 },
  /**
   * How far down the source the window sits: 0 is its top edge, 1 its bottom.
   *
   * This was an SVG "xMidYMin slice" — top-anchored — which is the obvious
   * reading of "keep the face" and takes the top 210 rows of a 400-row
   * portrait. The face does not fit in 210 rows. Both photographs in this
   * project have been showing a man with his chin cut off at the window edge.
   *
   * 0.45 puts the eyes on the upper third and leaves the jaw inside the
   * frame, which is where a portrait is normally cropped. It is one number
   * in one place precisely so that the answer cannot be right in the
   * rendered camp and wrong in the illustrated one.
   */
  anchor: 0.45,
  matrix: [
    [0.44, 0.42, 0.12, 0, 0.06],
    [0.36, 0.44, 0.1, 0, 0.03],
    [0.26, 0.32, 0.14, 0, 0.01],
    [0, 0, 0, 1, 0],
  ],
} as const;

/** The matrix as an SVG feColorMatrix values attribute. */
export function printMatrixValues(): string {
  return CAMP_PRINT.matrix.map((row) => row.join(" ")).join("\n");
}

/**
 * Where to hang the SVG image element so the window lands on the anchored crop.
 *
 * preserveAspectRatio only offers top, middle and bottom, and the answer is
 * none of those. So the element is given the whole scaled image as its box —
 * same aspect as the file, so nothing is squashed and nothing is sliced — and
 * moved up until the anchored rows sit inside the window. The clip path stays
 * where it is, and that is what turns the shift into a crop.
 *
 * Shifting only the `y` and leaving a window-sized box does not work: an
 * `image` element establishes a viewport of its own with `overflow: hidden`,
 * so the box takes its clip with it and the two clips intersect to a sliver.
 */
export function printImageBox(): { x: number; y: number; w: number; h: number } {
  const { source, window: win, anchor } = CAMP_PRINT;
  const scale = Math.max(win.w / source.w, win.h / source.h);
  const h = Math.round(source.h * scale * 10) / 10;
  const shift = anchor * (h - win.h);
  return {
    x: win.x,
    y: Math.round((win.y - shift) * 10) / 10,
    w: Math.round(source.w * scale * 10) / 10,
    h,
  };
}

/* --- the ground itself ---------------------------------------------------- */

/**
 * How high the ground is at a point, in metres.
 *
 * §10 asks for layered terrain rather than one large detailed mesh, and the
 * layer that was missing was the one underfoot: the camp stood on a single
 * flat plane, which is why it read as a floor with scenery behind it rather
 * than as ground. Four sine waves at unrelated frequencies is enough — this
 * is not a landscape, it is the difference between flat and not flat, and at
 * blue hour with one low light raking across it that difference is most of
 * what says "outdoors".
 *
 * Deterministic and rounded, like everything else generated here, because the
 * server and the browser both compute it and a difference in the fifteenth
 * decimal is a hydration mismatch.
 *
 * The camp stands on a flat patch. That is not a shortcut — it is what a camp
 * is, somewhere level enough to pitch on — and it means the tent, the table,
 * the chair and the fire can all sit at y = 0 without anyone sampling a
 * height to place them. The flat zone is centred between them and wide enough
 * to clear the furthest, which is the tent at 2.95m from centre.
 */
const GROUND_AMP = 0.075;
const CAMP_CENTRE = { x: -0.5, z: 0.4 };
const FLAT_RADIUS = 3.2;
const FULL_RADIUS = 8;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function groundHeight(x: number, z: number): number {
  const h =
    Math.sin(x * 0.42 + 1.7) * 0.55 +
    Math.sin(z * 0.37 - 0.8) * 0.5 +
    Math.sin((x + z) * 0.23 + 2.9) * 0.38 +
    Math.sin((x - z * 0.7) * 0.61 - 1.4) * 0.22;

  const d = Math.hypot(x - CAMP_CENTRE.x, z - CAMP_CENTRE.z);
  const mask = smoothstep(FLAT_RADIUS, FULL_RADIUS, d);

  return Math.round(h * GROUND_AMP * mask * 1000) / 1000;
}

/** How far down the displaced ground can reach, so anything underneath it
 *  can be placed low enough never to poke through. */
export const GROUND_MIN = -Math.round(1.65 * GROUND_AMP * 1000) / 1000;
