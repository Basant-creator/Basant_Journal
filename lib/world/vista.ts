/**
 * The territory the survey sheet describes.
 *
 * Step 10 reframes `/frontier` rather than rebuilding it: the map engine is
 * untouched, and this is the *place* the map is being read in. High ground at
 * dusk, the sheet held out against the country it maps — distant ridges above
 * its top edge, near scrub crossing its bottom one.
 *
 * Coordinate space is the vista frame: 1600 x 1190. That is the sheet's own
 * 1600 x 1000 with a margin of world around it. The inset below and the
 * padding in FrontierMap.module.css are the same composition written twice —
 * SHEET_INSET is what keeps them honest, so read both before moving either.
 *
 * Everything is seeded, like the rest of the map: the server and the client
 * have to draw the same ridge or React reports a hydration mismatch.
 */

import { type Point, pt, smoothPath } from "@/lib/map/geometry";
import { type Rng, createRng, seedFrom } from "@/lib/map/rng";

export const VISTA_WIDTH = 1600;
export const VISTA_HEIGHT = 1260;

/**
 * Where the sheet sits inside the frame, in vista units.
 *
 * The top margin is the one number here that was chosen twice. At 150 there
 * was not enough sky to hold three ridgelines *and* the warm band of light
 * above them, so the light ended up entirely behind the ridges and the whole
 * strip read as a dark border. 210 gives each ridge about fifty units of its
 * own, which is the least you can see a horizon in.
 */
export const SHEET_INSET = { left: 64, top: 210, width: 1472, height: 920 };

/**
 * The sheet's top edge rests on the horizon, and its bottom edge is where the
 * near ground begins. Both rhymes are deliberate: the artifact is *in* the
 * landscape rather than floating over a backdrop.
 */
const HORIZON = SHEET_INSET.top;
const GROUND = SHEET_INSET.top + SHEET_INSET.height;

/**
 * Every layer is drawn wider than the frame.
 *
 * Parallax slides these layers by up to 58px, and a silhouette that stopped
 * at the frame edge would slide its own edge into view. Overscan is cheaper
 * than clipping and does not cost a compositing layer.
 */
const OVERSCAN = 80;

/**
 * A ridge profile.
 *
 * Three sine terms at unrelated periods, each given its phase by the seeded
 * stream, then displaced. Fractal subdivision would be the textbook answer;
 * this is cheaper, and at this scale — a strip of horizon about ninety pixels
 * tall — nobody can tell the difference between real self-similarity and
 * three waves that never quite line up.
 */
function crest(rng: Rng, baseY: number, amplitude: number, steps: number): Point[] {
  const phaseA = rng.range(0, Math.PI * 2);
  const phaseB = rng.range(0, Math.PI * 2);
  const phaseC = rng.range(0, Math.PI * 2);

  const points: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const shape =
      Math.sin(t * Math.PI * 1.6 + phaseA) * 0.58 +
      Math.sin(t * Math.PI * 3.7 + phaseB) * 0.27 +
      Math.sin(t * Math.PI * 7.9 + phaseC) * 0.15;

    points.push(
      pt(
        -OVERSCAN + t * (VISTA_WIDTH + OVERSCAN * 2),
        baseY - shape * amplitude + rng.jitter(amplitude * 0.09),
      ),
    );
  }
  return points;
}

/** A crest closed into a silhouette that fills everything below it. */
function silhouette(points: Point[]): string {
  const right = VISTA_WIDTH + OVERSCAN;
  const bottom = VISTA_HEIGHT + OVERSCAN;
  return `${smoothPath(points)} L ${right} ${bottom} L ${-OVERSCAN} ${bottom} Z`;
}

export interface Ridge {
  path: string;
  /** Crest height, for placing the haze that settles in front of it. */
  crestY: number;
}

/**
 * Three ridges, furthest first.
 *
 * They are ordered by how high they sit in frame, which is the right way
 * round for a viewer standing above a valley: the far country is up near the
 * horizon and the land descends toward your boots.
 */
/** How each ridge is cut. One list, so 2D and 3D cannot drift apart. */
const RIDGE_CUTS = [
  { base: 140, amplitude: 26, steps: 48 },
  { base: 95, amplitude: 22, steps: 42 },
  { base: 45, amplitude: 17, steps: 36 },
] as const;

/**
 * The ridges as numbers, before anything decides how to draw them.
 *
 * The 2D map paints these as SVG silhouettes and the 3D camp builds them as
 * geometry, and they have to be the *same country* — a visitor who walks from
 * the survey sheet into Camp should recognise the skyline. That only holds if
 * both read one generator rather than two that were written to look alike.
 *
 * The three profiles are drawn from a single seeded stream in a fixed order,
 * so this function and the paths built from it are the same terrain by
 * construction and not by coincidence.
 */
export function ridgeProfiles(): Point[][] {
  const rng = createRng(seedFrom("frontier-vista-ridges"));
  return RIDGE_CUTS.map((cut) => crest(rng, HORIZON - cut.base, cut.amplitude, cut.steps));
}

export function buildRidges(): Ridge[] {
  const profiles = ridgeProfiles();
  return RIDGE_CUTS.map((cut, i) => ({
    path: silhouette(profiles[i]),
    crestY: HORIZON - cut.base,
  }));
}

/**
 * The near ground: the bank the viewer is standing on, undulating rather than
 * ruled, filling the frame from just below the sheet to the bottom edge.
 */
export function buildGround(): string {
  const rng = createRng(seedFrom("frontier-vista-ground"));
  return silhouette(crest(rng, GROUND + 58, 14, 22));
}

export interface Blade {
  d: string;
  width: number;
}

/**
 * The scrub in front of the sheet.
 *
 * This is the layer that does the real work. A silhouette *crossing* the
 * sheet's edge is what makes the sheet an object with something in front of
 * it rather than a panel with a picture behind it — so a few blades are
 * allowed over the paper, and the amount is small and deliberate.
 *
 * Two limits keep it from costing anything:
 *
 *   1. Nothing rises more than 18 units above the sheet's bottom edge, which
 *      is under 2% of the sheet's height — inside the neat line, clear of
 *      every drawn thing on the map.
 *   2. Nothing tall grows between x 120 and 380, because the sheet's scale
 *      bar sits directly above that stretch and a scale bar you cannot read
 *      is not a scale bar.
 */
export function buildScrub(): Blade[] {
  const rng = createRng(seedFrom("frontier-vista-scrub"));
  const blades: Blade[] = [];

  const CLEAR_FROM = 120;
  const CLEAR_TO = 380;
  /** Rooted below the frame, inside the ground mass that is drawn over them. */
  const ROOT = VISTA_HEIGHT + 24;

  for (let x = -OVERSCAN; x < VISTA_WIDTH + OVERSCAN; x += rng.range(22, 96)) {
    // Bare ground between the clumps. Evenly spaced grass is the thing that
    // reads as a decorative fringe rather than as scrub, and the gaps are what
    // fix it — more than the blade shapes do.
    if (rng.chance(0.18)) continue;

    const clump = Math.round(rng.range(3, 8));
    const underScale = x > CLEAR_FROM && x < CLEAR_TO;
    // Most clumps are low and a few are tall, rather than all being average.
    const vigour = Math.pow(rng.next(), 2.2);

    for (let i = 0; i < clump; i += 1) {
      const base = x + rng.jitter(24);
      const height = 92 + rng.range(0, 40) + vigour * 92;

      // The ceiling is per blade, not per clump: clamping every tall blade to
      // one value would draw a ruled line of tips across the frame, which is
      // the single most obvious way to make generated grass look generated.
      const ceiling = underScale
        ? GROUND + rng.range(6, 30)
        : GROUND - 18 + rng.range(0, 26);
      const tipY = Math.max(ROOT - height, ceiling);

      // Blades lean, and a clump leans together with a little disagreement.
      const lean = rng.range(-46, 46);
      const bend = rng.range(0.24, 0.52);
      const mid = tipY + (ROOT - tipY) * 0.42;

      blades.push({
        d:
          `M ${base.toFixed(1)} ${ROOT} ` +
          `Q ${(base + lean * bend).toFixed(1)} ${mid.toFixed(1)} ` +
          `${(base + lean).toFixed(1)} ${tipY.toFixed(1)}`,
        width: Number(rng.range(1.6, 4.2).toFixed(2)),
      });
    }
  }

  return blades;
}
