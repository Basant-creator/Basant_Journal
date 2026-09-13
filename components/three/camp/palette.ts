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
 * The illustrated camp now reads the same hour. `--camp-sky-*` and
 * `--camp-land-*` in `app/globals.css` are the source of truth for both
 * renderings; the values below are that block restated, because a material
 * cannot read a custom property — by the time a colour reaches the GPU it is
 * a number, and there is no cascade out there.
 *
 * So this is a duplication with a rule attached: change a value here and
 * change it in globals.css, or the two camps quietly become two places
 * again. It is deliberately short for that reason.
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
  /** How much light is left at a distance from where the sun set. These are
   *  multipliers, not colours — white leaves a texel alone and anything
   *  darker takes light out of it, cooling slightly as it goes, which is what
   *  distance does to an afterglow. */
  falloffNear: "#e4e2e6",
  falloffFar: "#b9bfcc",
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
  /** Separation. Colder than the key and far weaker: an edge it catches
   *  should read as the sky finding it, not as a second sun. */
  rim: "#7f9ec4",
  sky: "#3f5570",
  bounce: "#1a1c1f",
} as const;

/**
 * The camp itself.
 *
 * Everything here is a surface the fire will reach, which is why these are the
 * only values in this file chosen to be *lit* rather than to be a silhouette.
 * They read as near-black at blue hour and warm up as the fire finds them —
 * that swing is the whole reason the camp reads as a place with something
 * burning in it rather than as shapes on a gradient.
 *
 * Canvas is the lightest thing in the camp on purpose: it is what the fire
 * will paint most obviously, and a tent that stays dark is a tent nobody looks
 * at.
 */
export const camp = {
  canvas: "#6d6355",
  canvasShade: "#3a352e",
  timber: "#4a3a2b",
  timberDark: "#2a2119",
  rock: "#3c4149",
  grass: "#2f3a32",
} as const;

/**
 * The only warm thing in the scene.
 *
 * Every other value in this file is cool by design so that these four have
 * somewhere to land. §5 puts the whole art direction on that contrast, and it
 * only works if the fire is genuinely the sole warm source — a second warm
 * light anywhere in the frame and the eye stops knowing where to go.
 *
 * `glow` is the light, not the flame: lights read hotter than the geometry
 * that emits them, so the point light is paler than the fire it comes out of.
 */
export const fire = {
  core: "#ffd79a",
  body: "#e8883c",
  ember: "#c2532a",
  log: "#241a13",
  glow: "#ff9d52",
} as const;

/**
 * Smoke.
 *
 * Its own value rather than a sky tone, because the first pass reused
 * sky.mid and rendered as nothing: a dark blue at a tenth of an opacity,
 * over near-black ground, is a plume that exists in the scene graph and
 * nowhere else.
 *
 * Smoke is visible because it is *lighter* than what it crosses, and what
 * it crosses here is the darkest part of the picture. Pale and barely warm
 * — a fire's smoke picks up the fire at its base and loses it on the way
 * up, and this sits at the average rather than animating the difference.
 */
export const smoke = "#6f7684";

/**
 * What is on the table.
 *
 * Paper is the lightest thing in the camp after the flame itself, which is
 * deliberate: these are the objects a visitor is meant to notice, and at blue
 * hour the fire reaching a pale surface is the strongest signal the scene has
 * for "look here". Everything structural around them — timber, tin, leather —
 * stays dark so the paper is what the light finds.
 */
export const props = {
  paper: "#c9bda4",
  paperEdge: "#9d9078",
  parchment: "#bfae8c",
  ink: "#2b2a30",
  leather: "#3a2b22",
  tin: "#585c62",
  brass: "#7a6238",
  glass: "#ffca7d",
  /** Red ink on paper: THE HAND, at rest and when it has been noticed.
   *  The only red in this scene, and a few dozen pixels of it. */
  mark: "#8c2f2a",
  markLit: "#d4584a",
  /** The corner darkening every small print on a table has. Matches the
   *  vignette the record's own photograph carries, so a visitor who opens
   *  the record is looking at the same object treated the same way. */
  printEdge: "#241b12",
  /** What an object warms toward when it is reached for. The fire's own
   *  light, because nothing in this camp glows on its own. */
  glow: "#ff9d52",
} as const;

/**
 * A palette colour at partial strength.
 *
 * Canvas textures need `rgba()` strings, and the moment that is written by
 * hand the colour has left the palette — which is the one thing this folder is
 * not allowed to do. Three raw `rgba(74, 58, 43, ...)` had already accumulated
 * in the object textures before anyone noticed they were `camp.timber` spelled
 * out.
 */
export function tint(hex: string, alpha: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
