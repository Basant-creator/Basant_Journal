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
 * Where each object sits on the table, as a share of the scene. The buttons
 * that make them interactive are positioned from these same numbers, so the
 * hit area and the drawing can never drift apart.
 */
export const CAMP_OBJECTS = {
  notebook: { x: 24.5, y: 76, w: 20, h: 17 },
  photograph: { x: 47.5, y: 79, w: 13, h: 15 },
  notes: { x: 64.5, y: 76.5, w: 15, h: 14 },
  map: { x: 83, y: 77.5, w: 17, h: 16 },
} as const;

export type CampObjectId = keyof typeof CAMP_OBJECTS;
