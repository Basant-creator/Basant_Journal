
/**
 * One territory, two hours.
 *
 * §8 is the whole design constraint: the geometry is shared and *only* the
 * light, the air and the surface tone differ. So this file holds two complete
 * environments and nothing else — no shapes, no positions. If a value here
 * described where a mountain stands, the two hours could drift into two
 * different places, which is exactly what §8 forbids.
 *
 * The dusk column is the site's existing identity, restated (§7: preserve it).
 * Its values come from `palette.ts`, which in turn restates `design/tokens.css`
 * — the one duplicated list in the project, and the reason it is kept short.
 *
 * The dawn column is new and is deliberately *not* bright. §7 warns against a
 * generic light website and §5 against saturation; a frontier at dawn is dusty
 * and low-contrast, not a blue-sky holiday. Every dawn value below is a
 * desaturated earth tone, and the brightest thing in it is the haze.
 */

export interface HourEnvironment {
  /** Upper sky, horizon, and the warm band between them. */
  sky: { top: string; middle: string; horizon: string };
  /** What the renderer clears to and the fog fades into. */
  air: { fog: string; near: number; far: number };
  sun: {
    colour: string;
    intensity: number;
    /** Where it sits. §23 interpolates between these rather than flipping. */
    position: [number, number, number];
  };
  ambient: { colour: string; intensity: number };
  /** The ground bounce, which is what keeps terrain off pure black. */
  bounce: string;
  /**
   * Skylight: sky colour onto up-facing normals, bounce onto down-facing.
   *
   * Per hour, because the two hours need very different amounts of it. At
   * dusk the sun is under the ridge and an up-facing floor is lit by the sky
   * and almost nothing else, so this is most of the ground's light. At dawn
   * the sun is up and doing that work, and the same value washes the floor
   * pale enough that the page's own light-on-dark type stops holding against
   * it — which is how the footer disappeared the first time this was raised
   * as a single shared number.
   */
  hemisphere: number;
  /**
   * Surfaces, furthest to nearest. Atmospheric perspective lives here rather
   * than only in the fog: distant rock is *already* closer to the sky colour
   * before any fog is applied (§25).
   */
  ground: {
    far: string;
    ridge: string;
    hill: string;
    plain: string;
    rock: string;
    scrub: string;
    trail: string;
  };
  /** The herd, and anything else read purely as silhouette (§21). */
  creature: string;
}

/**
 * Dusk. The hour this site was designed at.
 *
 * Warm light that has already gone below the ridge, a violet band above it,
 * and everything in front reading as silhouette. The terrain tones started as
 * the `--scene-depth-N` family the Camp uses and have since been spread apart
 * — see the note on `ground` below for why, and for what is still shared.
 */
const dusk: HourEnvironment = {
  sky: {
    top: "#171119",
    middle: "#382d40",
    horizon: "#8a4f26",
  },
  /*
    The air, lifted off black and opened out.

    This used to be #1b1410 with a far plane at 96, which put the furthest
    range past the fog entirely and crushed the two behind it into the same
    near-black. The result was the thing this phase exists to avoid: a
    landscape built as layers that read as one flat shape, with the faceting
    invisible because every facet resolved to the same colour.

    Distance now settles onto a tone rather than into nothing, and the far
    plane is out past the last ridge so the range is *hazy* instead of gone.
  */
  air: { fog: "#3a2c20", near: 40, far: 186 },
  sun: {
    colour: "#e8a862",
    intensity: 1.6,
    /* Low and to the left, where the sky is warmest. */
    position: [-14, 3.4, -6],
  },
  /*
    Ambient well up from 0.5. A low ambient at dusk is physically reasonable
    and visually fatal here: the only thing separating one facet from the next
    is how much sky each catches, and at 0.5 the unlit faces all bottomed out
    together. This is the single biggest contributor to the geometry reading
    as geometry.

    Raised again, 0.74 -> 0.95, with the bounce lifted to match. Photographed
    at 1440x900 the sky was carrying the whole frame: the mesas read as
    silhouette against it, and everything from the mid ground down was one
    black mass. The sun is low and to the left, so the ground plane catches
    almost nothing but ambient and bounce — which is why the fix is here and
    not in the fog, whose work is all at distance and could not have reached
    the foreground anyway. The near plane moves out with it so the haze starts
    past the front edge rather than on it.
  */
  ambient: { colour: "#6a7488", intensity: 0.95 },
  bounce: "#5d4c39",
  hemisphere: 0.9,
  /*
    The depth ladder, spread.

    These were `scene.depth[0..2]` verbatim — the tokens the Camp uses — and
    the tie was deliberate (§6 asks the two places to share a palette). But
    that ladder was built for *overlaid flat bands* in a drawing, where a two
    per cent step is enough to separate one plane from the next. Lit geometry
    in fog needs much more, and at the token values the three ranges resolved
    to within a few points of each other and of the air behind them.

    Same hue family, same intent, roughly double the separation: the far range
    is nearly the haze, the near hills are nearly the ground, and there is
    visible country in between. Deliberate divergence, recorded here rather
    than silently drifting.
  */
  /*
    The ladder, rebuilt for the tone curve it is actually drawn through.

    These were authored as if the pipeline were linear, and it is not: the
    renderer runs ACES filmic at 1.05 exposure, whose toe compresses hard
    below about 0.02. Measured off a 1440x900 capture, the lower half of the
    frame came back at #030202 to #070606 — not dark, *gone*. Lifting the
    near end by a few points did nothing, because a few points of albedo
    under that curve is still inside the toe.

    Worked back through it instead. The floor faces up, the sun is low and to
    the left, so it collects about 0.42 of white between ambient, bounce and
    a grazing sun; landing the plain at a readable value off that needs an
    albedo near 0.07 linear, which is this. The whole ladder moves together
    so the relationships that were tuned — far nearest the haze, plain
    darkest — survive intact.

    Dusk is still dusk. It reads as evening because the sky is violet, the
    sun is under the ridge and the air is warm and closing, not because the
    ground is black. In a photograph of this hour the ground is never black.
  */
  ground: {
    far: "#74634c",
    ridge: "#635443",
    hill: "#564633",
    plain: "#4c3d2a",
    rock: "#83654a",
    scrub: "#576141",
    trail: "#8d6e4c",
  },
  creature: "#141b24",
};

/**
 * Dawn. The same country, some hours earlier.
 *
 * The sun is on the other side and still low, so the shadows run the other
 * way and the light is thinner. What makes this read as morning rather than
 * as "the same picture, brighter" is the haze: the fog is the *lightest*
 * colour in the scene, so distance washes toward white instead of toward
 * black, and the far mountains all but dissolve (§25).
 *
 * The ground is warmer than the mountains on purpose. Cool distance against
 * warm foreground is the oldest trick in landscape painting and it is doing
 * most of the depth here.
 */
const dawn: HourEnvironment = {
  sky: {
    top: "#7b8ea8",
    middle: "#bfa593",
    horizon: "#e7bb87",
  },
  /* Haze closes in: you can see less far at dawn, not more. */
  air: { fog: "#bfae97", near: 26, far: 140 },
  sun: {
    colour: "#ffd9a8",
    intensity: 1.7,
    /* Mirrored to the right, and a little higher. The land is the same; the
       morning simply comes from the other side of it. */
    position: [15, 4.6, -6],
  },
  ambient: { colour: "#9db0c6", intensity: 0.78 },
  bounce: "#8a7860",
  hemisphere: 0.3,
  ground: {
    /* Cool and pale: the far range is nearly the haze itself. */
    far: "#9aa3b2",
    ridge: "#8a8792",
    hill: "#7a7166",
    plain: "#8c7a5c",
    rock: "#9c8062",
    scrub: "#6d7152",
    trail: "#a8926c",
  },
  creature: "#3b3630",
};

export const hours = { dusk, dawn } as const;
