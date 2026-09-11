/**
 * Torn paper edges.
 *
 * A tear is not a wobble. Real torn paper has three things a wavy line does
 * not: a coarse rhythm of bites out of the edge, a finer fibre fringe riding
 * on top of it, and the occasional deep notch where the sheet gave way. All
 * three are generated here from the same seeded stream the map uses, so an
 * edge is stable across renders and re-tunable by changing a number.
 *
 * Paths are emitted in objectBoundingBox units (0..1) so one clipPath works at
 * any size. The slight aspect distortion that comes with that is welcome — a
 * tear has no business looking uniform.
 */

import { createRng, seedFrom } from "@/lib/map/rng";

export type TornEdge = "top" | "right" | "bottom" | "left";

export interface TornOptions {
  /** Which edges are torn. Everything else is cut clean. */
  edges: TornEdge[];
  /** Depth of the tear as a fraction of the box. 0.012–0.05 reads as paper. */
  amplitude?: number;
  /** Bites per edge. Fewer reads as a coarse rip, more as a careful tear. */
  segments?: number;
  /** A torn-away corner, for a sheet that has lost one. */
  cornerTear?: "none" | "tl" | "tr" | "br" | "bl";
}

interface Pt {
  x: number;
  y: number;
}

const round = (n: number) => Math.round(n * 10000) / 10000;

/**
 * One torn run from `from` to `to`.
 *
 * `outward` is the unit direction the tear bites toward — always out of the
 * sheet, so the clip removes material rather than adding it.
 */
function tornRun(
  from: Pt,
  to: Pt,
  outward: Pt,
  rng: ReturnType<typeof createRng>,
  amplitude: number,
  segments: number,
): Pt[] {
  const points: Pt[] = [];

  for (let i = 1; i < segments; i += 1) {
    const t = i / segments + rng.jitter(0.35 / segments);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;

    // Coarse bite, plus a fine fibre tremor, plus rare deep notches.
    let depth = Math.abs(rng.jitter(1)) * amplitude * 0.75 + amplitude * 0.15;
    depth += rng.jitter(amplitude * 0.22);
    if (rng.chance(0.09)) depth += amplitude * rng.range(0.8, 1.6);

    points.push({ x: x + outward.x * depth, y: y + outward.y * depth });
  }

  return points;
}

const CORNERS: Record<string, Pt> = {
  tl: { x: 0, y: 0 },
  tr: { x: 1, y: 0 },
  br: { x: 1, y: 1 },
  bl: { x: 0, y: 1 },
};

/**
 * The clip path for a torn sheet, as a `d` string in objectBoundingBox units.
 */
export function tornPath(seed: string, options: TornOptions): string {
  const { edges, amplitude = 0.022, segments = 14, cornerTear = "none" } = options;
  const rng = createRng(seedFrom(`torn:${seed}`));
  const torn = new Set(edges);

  const tl = { x: 0, y: 0 };
  const tr = { x: 1, y: 0 };
  const br = { x: 1, y: 1 };
  const bl = { x: 0, y: 1 };

  const run = (from: Pt, to: Pt, outward: Pt, edge: TornEdge): Pt[] =>
    torn.has(edge) ? tornRun(from, to, outward, rng, amplitude, segments) : [];

  const points: Pt[] = [
    tl,
    ...run(tl, tr, { x: 0, y: -1 }, "top"),
    tr,
    ...run(tr, br, { x: 1, y: 0 }, "right"),
    br,
    ...run(br, bl, { x: 0, y: 1 }, "bottom"),
    bl,
    ...run(bl, tl, { x: -1, y: 0 }, "left"),
  ];

  if (cornerTear !== "none") {
    const corner = CORNERS[cornerTear];
    const index = points.findIndex((p) => p.x === corner.x && p.y === corner.y);
    if (index >= 0) {
      // Replace the square corner with a diagonal bite across it.
      const bite = rng.range(0.06, 0.13);
      const inwardX = corner.x === 0 ? bite : -bite;
      const inwardY = corner.y === 0 ? bite : -bite;
      points.splice(
        index,
        1,
        { x: corner.x + inwardX, y: corner.y },
        { x: corner.x + inwardX * 0.45, y: corner.y + inwardY * 0.55 },
        { x: corner.x, y: corner.y + inwardY },
      );
    }
  }

  const body = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${round(p.x)} ${round(p.y)}`)
    .join(" ");

  return `${body} Z`;
}

/**
 * A slightly deeper copy of the same edge, drawn behind the sheet in a lighter
 * tone. This is the fibre fringe: the pale, soft lip you see where paper has
 * pulled apart rather than been cut.
 */
export function fringePath(seed: string, options: TornOptions): string {
  return tornPath(`${seed}:fringe`, {
    ...options,
    amplitude: (options.amplitude ?? 0.022) * 1.55,
    segments: Math.round((options.segments ?? 14) * 0.7),
  });
}
