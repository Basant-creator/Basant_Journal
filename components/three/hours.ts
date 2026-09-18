import { scene } from "./palette";

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
 * and everything in front reading as silhouette. The terrain colours are the
 * existing `--scene-depth-N` family, so the landing and the Camp are lit by
 * the same evening.
 */
const dusk: HourEnvironment = {
  sky: {
    top: "#100c0a",
    middle: "#2a2130",
    horizon: "#8a4f26",
  },
  air: { fog: "#1b1410", near: 26, far: 96 },
  sun: {
    colour: "#e8a862",
    intensity: 1.5,
    /* Low and to the left, where the sky is warmest. */
    position: [-14, 3.4, -6],
  },
  ambient: { colour: "#5a6478", intensity: 0.5 },
  bounce: "#3c3126",
  ground: {
    far: scene.depth[0],
    ridge: scene.depth[1],
    hill: scene.depth[2],
    plain: scene.ground,
    rock: "#2a2018",
    scrub: "#1d2017",
    trail: "#2f2519",
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
  air: { fog: "#bfae97", near: 20, far: 84 },
  sun: {
    colour: "#ffd9a8",
    intensity: 1.7,
    /* Mirrored to the right, and a little higher. The land is the same; the
       morning simply comes from the other side of it. */
    position: [15, 4.6, -6],
  },
  ambient: { colour: "#9db0c6", intensity: 0.78 },
  bounce: "#8a7860",
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
