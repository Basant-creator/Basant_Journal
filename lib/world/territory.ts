import { createRng, seedFrom } from "@/lib/map/rng";

/**
 * The territory: what the landing looks out over.
 *
 * Geometry only. Not one colour lives here, because §8 and §12 want a single
 * set of shapes wearing two different hours — the moment a position sat next
 * to a hex value, the dusk world and the dawn world could drift into two
 * different places, and the transition would stop being a change of light and
 * start being a change of scene.
 *
 * **Every emitted number is rounded.** Seeded output that is not rounded
 * differs between Node and the browser in the fifteenth decimal and React
 * calls it a hydration mismatch. This has bitten three components here
 * already.
 *
 * Composition follows §30 and §31. The title is the content; the land is what
 * stands behind it. So the far range is tall at the left and right edges and
 * *drops away in the middle* — the wordmark sits in that gap, against open
 * sky, framed by dark shoulders rather than fighting a silhouette. The mesas
 * and the herd sit right of centre, the left is deliberately quiet, and
 * nothing of any height stands directly behind the two buttons.
 */

const round = (n: number) => Math.round(n * 100) / 100;

/** Where the wordmark sits, in world x. The land opens up here. */
const TITLE_X = 0;
/** How wide the quiet gap is. Wide enough for "FRONTIER" plus its air. */
const TITLE_GAP = 26;

/* -------------------------------------------------------------------------
   RANGES

   Three bands of hills, furthest first. Each is a silhouette rather than a
   solid: a run of peaks along x that the renderer turns into one flat-shaded
   ribbon. That is the whole trick for cheap low-poly country — a range is
   read entirely from its outline, so modelling anything behind the outline is
   paying for geometry nobody can see.

   Further bands are modelled *larger*, not smaller. Perspective shrinks them
   on the way to the camera, and a distant range built at its apparent size
   is a bump.
   ------------------------------------------------------------------------- */

export interface Peak {
  x: number;
  /** Height above the band's base, in world units. */
  height: number;
}

export interface Range {
  id: string;
  z: number;
  /** Ground level the silhouette rises from. */
  base: number;
  peaks: Peak[];
  /** Which ground tone it wears: far, ridge or hill. */
  tone: "far" | "ridge" | "hill";
}

/**
 * One band of country.
 *
 * `frame` is how strongly the band is pulled down in the middle. At 1 the
 * centre is nearly flat and the edges carry everything, which is what the far
 * range wants (§31). Nearer bands frame less, because by then the title is
 * well above them and a dip would just look like a missing hill.
 */
function makeRange(
  id: string,
  z: number,
  base: number,
  tone: Range["tone"],
  { span, count, low, high, frame }: {
    span: number;
    count: number;
    low: number;
    high: number;
    frame: number;
  },
): Range {
  const rng = createRng(seedFrom(`territory:${id}`));
  const peaks: Peak[] = [];

  for (let i = 0; i < count; i += 1) {
    /* Even spacing, then knocked off it. A ridge of evenly spaced peaks
       reads as a comb, and the eye finds that out immediately. */
    const t = i / (count - 1);
    const x = round((t - 0.5) * span + (rng.next() - 0.5) * (span / count) * 0.8);

    /* The frame: how far this peak is from the title's gap, 0 at the centre
       and 1 once clear of it. Smoothed, so the range settles into the dip
       rather than stepping down into it. */
    const away = Math.min(1, Math.abs(x - TITLE_X) / TITLE_GAP);
    const opening = away * away * (3 - 2 * away);
    const framed = 1 - frame * (1 - opening);

    const height = round((low + rng.next() * (high - low)) * framed);
    peaks.push({ x, height });
  }

  peaks.sort((a, b) => a.x - b.x);
  return { id, z, base, peaks, tone };
}

export const ranges: Range[] = [
  /* The far range. Almost the colour of the sky, and the thing that says the
     territory does not stop at the edge of the screen. */
  makeRange("far", -78, -1.5, "far", {
    span: 240,
    count: 17,
    low: 9,
    high: 21,
    frame: 0.62,
  }),
  /* Middle distance: where the country stops being a backdrop. */
  makeRange("ridge", -52, -1.2, "ridge", {
    span: 170,
    count: 13,
    low: 4.5,
    high: 10,
    frame: 0.44,
  }),
  /* Low hills just behind the herd. Barely more than a swell. */
  makeRange("hill", -34, -0.9, "hill", {
    span: 130,
    count: 11,
    low: 1.8,
    high: 4.2,
    frame: 0.24,
  }),
];

/* -------------------------------------------------------------------------
   MESAS

   §29: a handful, not a skyline. Four flat-topped buttes, all right of
   centre, because that is where §30 puts the environmental depth and where
   the herd already is. A mesa on the left would close the quiet side.
   ------------------------------------------------------------------------- */

export interface Mesa {
  id: string;
  position: [number, number, number];
  /** Radius at the base; the top is narrower. */
  radius: number;
  height: number;
  /** Radial segments. Five or six: faceted on purpose (§5). */
  facets: number;
  /** Radians. Turns the facets so no two present the same face. */
  spin: number;
  taper: number;
}

export const mesas: Mesa[] = (() => {
  const rng = createRng(seedFrom("territory:mesas"));
  const placed: Array<[number, number]> = [
    /* x, z. Hand-placed rather than scattered: §30 is a composition, and
       four objects is few enough that randomness only makes it worse. */
    [34, -60],
    [52, -66],
    [26, -44],
    [-46, -70],
  ];

  return placed.map(([x, z], i) => ({
    id: `mesa-${i}`,
    position: [x, -1.1, z] as [number, number, number],
    radius: round(5.5 + rng.next() * 4.5),
    height: round(7 + rng.next() * 6.5),
    facets: rng.next() > 0.5 ? 6 : 5,
    spin: round(rng.next() * Math.PI),
    /* Flat tops, slightly undercut — a butte is wider at the bottom. */
    taper: round(0.62 + rng.next() * 0.16),
  }));
})();

/* -------------------------------------------------------------------------
   THE FLOOR

   One plane, gently displaced. Not a heightmap — the camera is low and level
   and almost none of it is visible as surface; what it does is stop the
   ground reading as a sheet of glass where it meets the hills.
   ------------------------------------------------------------------------- */

export const FLOOR = {
  width: 300,
  depth: 220,
  /** Segments. Low: this is a low-poly floor, and it is mostly seen edge-on. */
  segments: [40, 30] as [number, number],
  /** How far a vertex may lift or drop. */
  relief: 0.85,
} as const;

/** Seeded, rounded height at a floor vertex. */
export function floorHeight(x: number, z: number): number {
  const rng = createRng(seedFrom(`territory:floor:${Math.round(x)}:${Math.round(z)}`));
  /* Two scales of swell so it is not uniformly bumpy. */
  const broad = Math.sin(x * 0.037) * Math.cos(z * 0.029) * 0.55;
  return round((broad + (rng.next() - 0.5) * 0.9) * FLOOR.relief);
}

/* -------------------------------------------------------------------------
   SCATTER

   Rocks and scrub. §28 and §32 both say the same thing from opposite ends:
   sparse, and never in front of the words. So everything here is filtered
   against a keep-out corridor down the middle of the near ground, and the
   counts are small enough to list.
   ------------------------------------------------------------------------- */

export interface Scatter {
  id: string;
  position: [number, number, number];
  scale: number;
  spin: number;
  /** Non-uniform squash, so twelve copies of one rock are not twelve copies. */
  squash: [number, number, number];
}

/** Nothing of any height stands inside this box in the near ground. */
function clearOfText(x: number, z: number): boolean {
  if (z > -16) return Math.abs(x) > 15;
  return true;
}

function scatter(
  id: string,
  count: number,
  { fromZ, toZ, spread, min, max }: {
    fromZ: number;
    toZ: number;
    spread: number;
    min: number;
    max: number;
  },
): Scatter[] {
  const rng = createRng(seedFrom(`territory:${id}`));
  const out: Scatter[] = [];
  let guard = 0;

  while (out.length < count && guard < count * 12) {
    guard += 1;
    const x = round((rng.next() - 0.5) * spread);
    const z = round(fromZ + rng.next() * (toZ - fromZ));
    if (!clearOfText(x, z)) continue;

    out.push({
      id: `${id}-${out.length}`,
      position: [x, -1, z],
      scale: round(min + rng.next() * (max - min)),
      spin: round(rng.next() * Math.PI * 2),
      squash: [
        round(0.8 + rng.next() * 0.5),
        round(0.6 + rng.next() * 0.7),
        round(0.8 + rng.next() * 0.5),
      ],
    });
  }

  return out;
}

export const rocks = scatter("rocks", 14, {
  fromZ: -48,
  toZ: -8,
  spread: 130,
  min: 0.5,
  max: 1.9,
});

export const scrub = scatter("scrub", 30, {
  fromZ: -44,
  toZ: -6,
  spread: 150,
  min: 0.3,
  max: 0.85,
});

/* -------------------------------------------------------------------------
   THE TRAIL

   §29 wants a path, and a path does more for scale than any landmark: it is
   the one shape a viewer reads as "something came this way", and it converges,
   which sells distance for free.

   It runs from near-left to the horizon right of centre, passing under the
   herd. Sampled rather than curved so the renderer can build it as a ribbon.
   ------------------------------------------------------------------------- */

export interface TrailPoint {
  x: number;
  z: number;
  /** Half-width. Narrows with distance, which is most of the perspective. */
  half: number;
}

export const trail: TrailPoint[] = (() => {
  const rng = createRng(seedFrom("territory:trail"));
  const points: TrailPoint[] = [];
  const steps = 22;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    /* Near-left to far-right, easing so it straightens as it recedes. */
    const x = round(-26 + t * t * 46 + Math.sin(t * 5.2) * 2.4);
    const z = round(-4 - t * 58);
    const half = round((2.6 - t * 2.05) * (0.9 + rng.next() * 0.2));
    points.push({ x, z, half });
  }

  return points;
})();
