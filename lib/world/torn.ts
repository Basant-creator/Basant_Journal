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
  /**
   * Vertices per edge.
   *
   * Raised from 14 to 30 with the multi-scale depth above. At fourteen the
   * fine tremor had nowhere to live — every vertex was a visible corner, so
   * detail and shape were the same scale and the edge read as a graphic. At
   * thirty the coarse wander still shapes the edge and the tremor becomes
   * texture along it.
   */
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
 * `inward` is the unit vector pointing into the sheet body so the tear cuts
 * material away from the edges rather than extending outside the bounding box.
 */
function tornRun(
  from: Pt,
  to: Pt,
  inward: Pt,
  rng: ReturnType<typeof createRng>,
  amplitude: number,
  segments: number,
): Pt[] {
  const points: Pt[] = [];

  /*
    Paper tears in runs, and that is the whole difference.

    The first version of this drew each point's depth independently — white
    noise — which is why the edges read as a zigzag cut with pinking shears
    rather than as a tear. Nothing about a random value per vertex knows that
    the fibre beside it just gave way.

    Real paper does. A tear propagates: it runs shallow for a while, catches,
    digs in, and carries that state along the edge. So the depth here is three
    scales added together, the way a natural edge actually decomposes:

      coarse   a slow wander held across several segments — where the tear
               was running deep and where it was skimming the margin
      medium   the individual bites, independent per segment
      fine     a fibre tremor, small enough to read as texture rather than
               as shape

    Only the middle one is the old behaviour. The coarse term is what makes it
    look torn, and it costs one variable carried across the loop.
  */
  let coarse = rng.jitter(amplitude * 0.5);

  for (let i = 1; i < segments; i += 1) {
    const t = i / segments + rng.jitter(0.35 / segments);
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t;

    /* The wander drifts rather than jumping: a small step each segment, gently
       pulled back toward the edge so it cannot run away over a long run. */
    coarse += rng.jitter(amplitude * 0.28);
    coarse *= 0.86;

    const medium = Math.abs(rng.jitter(1)) * amplitude * 0.55;
    const fine = rng.jitter(amplitude * 0.16);

    let depth = amplitude * 0.16 + medium + fine + coarse;

    /* Where the sheet gave way altogether. Rare, and deeper than anything the
       three scales produce, so it reads as an event rather than as noise. */
    if (rng.chance(0.07)) depth += amplitude * rng.range(0.9, 1.8);

    /* A tear never crosses back outside the sheet. */
    depth = Math.max(amplitude * 0.04, depth);

    const px = Math.min(1, Math.max(0, x + inward.x * depth));
    const py = Math.min(1, Math.max(0, y + inward.y * depth));
    points.push({ x: round(px), y: round(py) });
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
  const { edges, amplitude = 0.022, segments = 30, cornerTear = "none" } = options;
  const rng = createRng(seedFrom(`torn:${seed}`));
  const torn = new Set(edges);

  const tl = { x: 0, y: 0 };
  const tr = { x: 1, y: 0 };
  const br = { x: 1, y: 1 };
  const bl = { x: 0, y: 1 };

  const run = (from: Pt, to: Pt, inward: Pt, edge: TornEdge): Pt[] =>
    torn.has(edge) ? tornRun(from, to, inward, rng, amplitude, segments) : [];

  const points: Pt[] = [
    tl,
    ...run(tl, tr, { x: 0, y: 1 }, "top"),
    tr,
    ...run(tr, br, { x: -1, y: 0 }, "right"),
    br,
    ...run(br, bl, { x: 0, y: -1 }, "bottom"),
    bl,
    ...run(bl, tl, { x: 1, y: 0 }, "left"),
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
        { x: round(corner.x + inwardX), y: round(corner.y) },
        { x: round(corner.x + inwardX * 0.45), y: round(corner.y + inwardY * 0.55) },
        { x: round(corner.x), y: round(corner.y + inwardY) },
      );
    }
  }

  const body = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${round(p.x)} ${round(p.y)}`)
    .join(" ");

  return `${body} Z`;
}

/**
 * A shallower cut copy of the edge drawn behind the sheet in a lighter tone.
 * Because the stock tears away deeper than this layer, the pale fibrous lip
 * is exposed along the edge — authentic physical paper tearing.
 */
export function fringePath(seed: string, options: TornOptions): string {
  return tornPath(`${seed}:fringe`, {
    ...options,
    amplitude: (options.amplitude ?? 0.022) * 0.55,
    segments: Math.round((options.segments ?? 30) * 0.75),
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

/* -------------------------------------------------------------------------
   Foxing.

   The brown spotting old paper develops where damp and iron in the pulp have
   met. It is the difference between paper that is *tinted* old and paper that
   has *aged*: a flat wash reads as a colour choice, and a scatter of small
   irregular stains reads as time.

   Emitted as CSS radial gradients rather than an image, so it scales, costs
   nothing to download, and recolours with the tokens. Seeded from the sheet's
   own name, so a given sheet is stained the same way on the server, on the
   client, and on every later visit — §25 of the field-book brief asks for
   controlled deterministic variation rather than a fresh face per render, and
   a stain that moves when you come back is worse than no stain at all.
   ------------------------------------------------------------------------- */

export interface FoxingOptions {
  /** Roughly how many marks. Real sheets carry a handful, not a rash. */
  count?: number;
  /** Peak opacity of the darkest mark. Small: this is a tint, not a blot. */
  strength?: number;
}

export function foxingLayer(seed: string, options: FoxingOptions = {}): string {
  const { count = 7, strength = 0.05 } = options;
  const rng = createRng(seedFrom(`foxing:${seed}`));
  const marks: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const x = round(rng.range(4, 96));
    const y = round(rng.range(4, 96));
    /* Mostly small, occasionally one that spread. */
    const size = round(rng.chance(0.18) ? rng.range(9, 16) : rng.range(3, 7));
    /* Elliptical: a stain spreads along the grain, never as a circle. */
    const stretch = round(size * rng.range(0.7, 1.5));
    const alpha = round(strength * rng.range(0.45, 1));

    marks.push(
      `radial-gradient(ellipse ${size}% ${stretch}% at ${x}% ${y}%, ` +
        `color-mix(in srgb, var(--paper-foxing) ${Math.round(alpha * 100)}%, transparent) 0%, ` +
        `transparent 70%)`,
    );
  }

  return marks.join(", ");
}
