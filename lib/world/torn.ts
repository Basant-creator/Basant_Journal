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

/* -------------------------------------------------------------------------
   Tearing a sheet in two.

   A tear is not a cut down the middle. Paper gives way along the path of
   least resistance: it runs, catches, jumps sideways, and the two halves that
   come apart are exact complements of each other — whatever one side loses,
   the other gained. Generating one seam and deriving both halves from it is
   what makes the pieces look like they were once the same sheet.
   ------------------------------------------------------------------------- */

export interface TearOptions {
  /** Where the seam crosses, as a fraction of the height. */
  at?: number;
  /** How far the seam wanders. 0.04-0.1 reads as paper rather than as a wave. */
  amplitude?: number;
  segments?: number;
}

/** The seam itself, left edge to right edge, in objectBoundingBox units. */
export function tearSeam(seed: string, options: TearOptions = {}): Pt[] {
  const { at = 0.5, amplitude = 0.06, segments = 20 } = options;
  const rng = createRng(seedFrom(`tear:${seed}`));
  const points: Pt[] = [];

  // A slow drift across the sheet, so the seam has an overall direction as
  // well as local noise — a tear that only wobbles reads as a decoration.
  const drift = rng.jitter(amplitude * 0.9);

  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    let y = at + drift * (t - 0.5) * 2;

    y += rng.jitter(amplitude * 0.55);
    // Occasionally the tear catches and jumps.
    if (i > 0 && i < segments && rng.chance(0.12)) {
      y += rng.jitter(amplitude * 1.5);
    }

    points.push({ x: t, y: Math.min(0.94, Math.max(0.06, y)) });
  }

  return points;
}

export interface TearHalves {
  /** Everything above the seam. */
  top: string;
  /** Everything below it, reaching a hair further up. */
  bottom: string;
  seam: Pt[];
}

/**
 * How far the lower half reaches back over the upper one.
 *
 * Exact complements are mathematically right and visibly wrong: two shapes
 * sharing a boundary are each anti-aliased against it, so neither covers it
 * fully and a pale hairline runs the width of the sheet — a crease, on a
 * sheet that is supposed to be intact. The lower half is painted second, so
 * giving it a fraction of a percent of overlap hides the joint. Once the
 * sheet comes apart the two edges are metres apart and nobody can tell.
 */
const SEAM_OVERLAP = 0.0025;

export function tearHalves(seed: string, options: TearOptions = {}): TearHalves {
  const seam = tearSeam(seed, options);
  const last = seam[seam.length - 1];

  const lower = seam.map((p) => ({ x: p.x, y: p.y - SEAM_OVERLAP }));
  const forward = lower.map((p) => `L ${round(p.x)} ${round(p.y)}`).join(" ");
  const backward = [...seam]
    .reverse()
    .map((p) => `L ${round(p.x)} ${round(p.y)}`)
    .join(" ");

  return {
    top: `M 0 0 L 1 0 L ${round(last.x)} ${round(last.y)} ${backward} L 0 0 Z`,
    bottom: `M ${round(lower[0].x)} ${round(lower[0].y)} ${forward} L 1 1 L 0 1 Z`,
    seam,
  };
}
