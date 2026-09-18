import { createRng, seedFrom } from "@/lib/map/rng";

/**
 * The living frontier: the landscape the landing page looks into.
 *
 * Everything here is geometry and timing, generated from a seed. No component
 * holds a magic number — §46 asks for the scene's figures to be
 * configuration rather than constants scattered through a render, and the
 * reason is the same one the map learned: a composition you can only change by
 * editing JSX is a composition nobody changes.
 *
 * **Every emitted number is rounded.** Seeded output that is not rounded
 * differs between Node and the browser in the fifteenth decimal, and React
 * calls that a hydration mismatch. This has bitten three components in this
 * repository already; it will not bite a fourth.
 */

const round = (n: number) => Math.round(n * 100) / 100;

/** The scene's coordinate space. Wide, because a frontier is wide. */
export const FRONTIER_WIDTH = 1600;
export const FRONTIER_HEIGHT = 900;

/* -------------------------------------------------------------------------
   DUST

   §18: subtle, occasionally catching the light. Positions are seeded so the
   motes do not reshuffle on every render.
   ------------------------------------------------------------------------- */

export interface Mote {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

export const dust: Mote[] = (() => {
  const rng = createRng(seedFrom("frontier:dust"));
  return Array.from({ length: 18 }, () => ({
    x: round(rng.range(0, 100)),
    y: round(rng.range(46, 96)),
    size: round(rng.range(1.2, 3.4)),
    duration: round(rng.range(26, 54)),
    delay: round(rng.range(-50, 0)),
    drift: round(rng.range(30, 90)),
  }));
})();

/* -------------------------------------------------------------------------
   THE TRAIL, AND THE SMOKE AT THE END OF IT

   §31 and §32: the landscape should hint that it leads somewhere, and the
   visitor should later realise it led to Camp. A faint trail running toward a
   thread of smoke on the horizon is the whole of it — one line and one
   column, both small, neither explained.
   ------------------------------------------------------------------------- */

export const trail = {
  /* Out of the foreground and away toward the smoke, narrowing as it goes. */
  d: "M 640 900 C 760 812, 918 742, 1044 700 S 1218 648, 1292 628",
  /** Where the smoke stands, in scene units. The trail arrives here. */
  smoke: { x: 1300, y: 616 },
} as const;
