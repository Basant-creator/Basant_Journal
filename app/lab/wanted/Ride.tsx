import { createRng, seedFrom } from "@/lib/map/rng";
import styles from "./ride.module.css";

const r2 = (n: number) => Math.round(n * 100) / 100;

/* A far ridge along the horizon, twice the width of the screen so it can
   be ridden past. Seeded and rounded, so the server and the browser draw
   the same hills. */
function ridge(seed: string, base: number, rough: number): string {
  const rng = createRng(seedFrom(seed));
  const pts: string[] = [];
  for (let x = 0; x <= 2400; x += 60) pts.push(`${x},${r2(base - rng.range(0, rough) - Math.sin(x / 310) * rough * 0.6)}`);
  return `M0,200 L${pts.join(" L")} L2400,200 Z`;
}
const FAR = ridge("wanted-ridge-far", 150, 46);
const NEAR = ridge("wanted-ridge-near", 176, 30);

/* Stars, scattered once: dots of different sizes in a tile the night sky
   repeats. */
const STARS = (() => {
  const rng = createRng(seedFrom("wanted-stars"));
  return Array.from({ length: 34 }, () => ({ x: r2(rng.range(0, 100)), y: r2(rng.range(0, 100)), r: r2(rng.range(0.5, 1.6)) }));
})();

/**
 * The ride: the page is read as one day on the road, dawn at the top and
 * night at the foot, and between the chapters the road itself.
 *
 * Behind everything, the sky: the light low on the horizon turning from
 * dawn rose through the day's dust to the dusk's red, then night closing in
 * from above with its stars, and a ridge along the horizon drifting past as
 * the page goes by. Between chapters, a passage ridden through, each one a
 * full screen: a dust storm out of camp, riding into the low sun on the way
 * to the work, nightfall before the letter is written.
 *
 * All of it is opacity and transform on layers that are only ever drawn
 * once, driven by the scroll itself (CSS scroll and view timelines), so the
 * compositor runs it at the screen's own rate and the main thread is never
 * asked for a frame of it. Without scroll timelines, with reduced motion,
 * or on the low grade, there is no passage and the sky is still.
 */
export function Ride() {
  return (
    <>
      <div className={styles.sky} aria-hidden="true">
        <span className={styles.dawn} />
        <span className={styles.dusk} />
        <span className={styles.night} />
        <svg className={styles.stars} width="100%" height="100%">
          <defs>
            <pattern id="ride-stars" width="320" height="220" patternUnits="userSpaceOnUse">
              {STARS.map((s, i) => (
                <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} />
              ))}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ride-stars)" />
        </svg>
        <svg className={`${styles.ridge} ${styles.ridgeFar}`} viewBox="0 0 2400 200" preserveAspectRatio="none">
          <path d={FAR} />
        </svg>
        <svg className={`${styles.ridge} ${styles.ridgeNear}`} viewBox="0 0 2400 200" preserveAspectRatio="none">
          <path d={NEAR} />
        </svg>
      </div>

      {/* Out of camp: a wall of dust blown across the screen. */}
      <div className={styles.passage} data-passage="storm" aria-hidden="true">
        <span className={styles.stormWall} />
        <span className={`${styles.band} ${styles.bandA}`} />
        <span className={`${styles.band} ${styles.bandB}`} />
        <span className={`${styles.band} ${styles.bandC}`} />
        <span className={styles.streaks} />
      </div>

      {/* Toward the work: riding into the low sun, the screen washed out. */}
      <div className={styles.passage} data-passage="sun" aria-hidden="true">
        <span className={styles.glare} />
        <span className={styles.sunDisc} />
        <span className={styles.flareLine} />
      </div>

      {/* Before the letter: night coming down, the stars, then the lamp. */}
      <div className={styles.passage} data-passage="night" aria-hidden="true">
        <span className={styles.dark} />
        <svg className={styles.nightStars} width="100%" height="100%">
          <rect width="100%" height="100%" fill="url(#ride-stars)" />
        </svg>
        <span className={styles.moon} />
      </div>
    </>
  );
}
