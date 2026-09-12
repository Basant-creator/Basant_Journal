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
