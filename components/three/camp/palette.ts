/**
 * Camp at blue hour.
 *
 * A separate palette from `components/three/palette.ts`, and the separation is
 * the art direction rather than an accident. That one is the illustrated
 * camp's dusk: #0d0b09 to #1a1410 to #33241a to #4a3220, warm all the way
 * down. §5 rules exactly that out — "do not make the environment orange/brown
 * everywhere" — and §6 says why it matters: a cool environment is what lets
 * the fire be the only warm thing in the frame, and therefore the thing an eye
 * goes to.
 *
 * The consequence is that the rendered Camp and the illustrated one are
 * currently at different hours. That is a real divergence, not a detail: the
 * two are meant to be the same place. The drawn sky follows at step 22.
 *
 * Blue hour is not black. The commonest failure here is a sky so dark it reads
 * as night, which throws away the atmospheric depth the whole composition
 * depends on — so the zenith is a deep blue that is still visibly blue, and
 * every band below it is lighter, not darker.
 */

export const sky = {
  /** Straight up. Dark, and still blue. */
  zenith: "#0c1018",
  high: "#131c2b",
  /** The blue that reads as sky rather than as absence. */
  mid: "#1e2c3e",
  /** Where the cool meets what the sun left. Muted on purpose: this is an
   *  afterglow, not a sunset, and a saturated band here would put a second
   *  warm light in a frame that is supposed to have one. */
  afterglow: "#6a5138",
  /** Below the band, cooling again into the haze the ridges sit in. */
  haze: "#243040",
} as const;

/**
 * The country, cooled.
 *
 * Three bands, each lighter and bluer than the one in front — aerial
 * perspective, which is the only thing that makes flat silhouettes read as
 * distance. The near band is nearly the ground's own colour; the far one is
 * most of the way to the sky.
 */
export const land = {
  far: "#2b3949",
  mid: "#1f2a36",
  near: "#151d26",
  treeline: "#101820",
  ground: "#131820",
} as const;

/**
 * Light.
 *
 * `key` is what is left of the sun: low, behind the ridges, and cool rather
 * than golden — the warm in this scene belongs to the fire and nothing else.
 * `sky` and `bounce` are the hemisphere, which at blue hour does most of the
 * actual lighting: an open sky is a very large soft source.
 */
export const light = {
  key: "#5d7392",
  sky: "#3f5570",
  bounce: "#1a1c1f",
} as const;
