import { createRng, seedFrom } from "@/lib/map/rng";

/**
 * The living frontier: the landscape the landing page looks into.
 *
 * Everything here is geometry and timing, generated from a seed. No component
 * holds a magic number — §46 asks for the camera and the herd to be
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
   THE HERD

   Six horses, and no two alike. §8 is the whole design: a herd whose members
   share a speed is a conveyor belt, and the eye finds that out immediately
   even when it cannot say why. So nothing is shared between two horses except
   the model — depth, scale, speed, starting place, gait rate and animation
   phase are all their own.

   World units, and the ground is y = 0. The scene runs them left to right
   across the middle distance; z is how far back each one is, and it carries
   the scale as well, because a horse that is further away is smaller *and*
   slower across the frame for the same real speed.

   No rider. The brief is explicit: horses only.
   ------------------------------------------------------------------------- */

export interface HerdHorse {
  id: string;
  /** Depth. More negative is further away. */
  z: number;
  /** Where in its run it starts, in world units along x. */
  x: number;
  scale: number;
  /** World units per second. */
  speed: number;
  /** Multiplier on the gallop clip, so the legs match the ground speed. */
  gait: number;
  /** Seconds into the clip at mount, so no two are in step. */
  phase: number;
}

export const herd: HerdHorse[] = (() => {
  const rng = createRng(seedFrom("frontier:herd"));

  /*
    The group's shape before it is disturbed: a leader, two close behind, and
    stragglers at the back and the flanks. The jitter is what stops it reading
    as a formation.
  */
  /*
    Ten of them, in two loose bands.

    Spread evenly across the run they were a thin stream: ten horses in the
    config and one on screen, because the camera sees perhaps forty units of
    an eighty-unit loop. A herd that is never more than one horse at a time is
    not a herd.

    So they are grouped — six leading, four straggling half a frame behind —
    which is also what §8 actually asks for: a leader, some close, some
    trailing, none of them in a line. The z values alternate near and far
    inside each band so the group reads as depth rather than as a row, and no
    two neighbours share a distance.

    Two mistakes were measured and corrected here. The first: bunched starts
    meant long stretches with nothing in frame at all, then several at once —
    so the x values are spread across the run rather than clustered. The
    second: at ten units out a horse spanned a third of the frame and crossed
    the wordmark, which is §3's "small against the landscape" and §21's "do
    not put the subject over the text" broken at the same time. They are three
    times further away now, which also buys the depth §30 asks for.
  */
  /*
    Pushed back again, by about sixteen units.

    The distances below were chosen when the landing was three tonal bands and
    empty air — there was nothing for a horse to be near *to*, so "far enough"
    meant "not over the wordmark". Now there is a floor, three ranges, four
    mesas and a trail, and against real country the herd read as standing in
    the reader's lap: too large, too detailed, and crowding the type.

    They sit between the low hills and the middle distance now, which is where
    §30 wants the depth and where a herd you are *watching* rather than
    *meeting* belongs.
  */
  const anchors: Array<[number, number]> = [
    // x, z — two loose bands rather than one thin stream
    // the leading group
    [-4, -42],
    [-12, -47],
    [-19, -40],
    [-9, -53],
    [-26, -49],
    [-21, -58],
    // the stragglers, half a frame behind
    [-48, -44],
    [-56, -51],
    [-63, -43],
    [-54, -60],
  ];



  return anchors.map(([x, z], i) => {
    /* Further back is smaller. Tied to z rather than rolled separately, so
       the herd never produces a distant horse that is somehow larger. */
    const depth = Math.abs(z);
    /*
      Gentler falloff than before. The curve was tuned for z between -24 and
      -44; at the new distances the same slope took the furthest horse under
      0.38 and it stopped reading as an animal at all. Perspective is already
      doing most of this work — this only keeps a distant horse from ever
      being drawn larger than a near one.
    */
    const scale = round(0.74 - depth * 0.0028 + rng.jitter(0.03));

    /* Speeds inside a narrow band. Too wide and the group pulls apart before
       it leaves the frame; identical and it is a conveyor belt. */
    const speed = round(rng.range(5.4, 7.2));

    return {
      id: `horse-${i}`,
      z: round(z + rng.jitter(1.2)),
      x: round(x + rng.jitter(2)),
      scale,
      speed,
      /* The clip was authored at one ground speed; a faster horse has to turn
         its legs over faster or it skates. Tuned against the model's own
         stride rather than guessed. */
      gait: round(speed / 6.2),
      phase: round(rng.range(0, 2.4)),
    };
  });
})();

/** How many of the herd each quality tier draws. §26. */
export const HERD_BY_TIER = { high: 10, medium: 6, low: 3 } as const;

/** Where the run wraps. A horse past this is put back at the far edge. */
/*
  Where the run wraps.

  Wider than the frame on both sides so a horse is put back well out of sight,
  and asymmetric: the herd enters from further out than it leaves, which gives
  the two bands room to separate before they come round again.
*/
export const HERD_RANGE = { from: -78, to: 40 } as const;

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
