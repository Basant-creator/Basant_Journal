import { terrain } from "@/lib/map/terrain";
import { FRONTIER_HEIGHT, FRONTIER_WIDTH, dust, trail } from "@/lib/world/frontier";
import styles from "./LandingScene.module.css";

/**
 * The living frontier.
 *
 * The landscape the visitor looks into before anything asks them for a click.
 * Three depth zones as §2 asks, and the depth is carried by tone rather than
 * by geometry: the far ridges sit close to the sky's own value, the midground
 * separates, and the near ground is nearly black. That is atmospheric
 * perspective, and §30 is right that it is what lets a small scene imply a
 * large country.
 *
 * **It ships no JavaScript.** Every moving part — the three bands drifting at
 * three rates, the dust, the smoke, the sun — is a CSS animation on
 * server-rendered markup. §25 asks for the landing to be lighter than the
 * Camp because it loads first, and the cheapest way to be lighter than a 3D
 * scene is to not be one. The ridges are the same seeded generator the survey
 * map draws itself from, so the country here and the country on the map are
 * literally the same country.
 *
 * Everything in it is decorative: the whole scene is aria-hidden and takes no
 * pointer events. §23 — nothing in the landscape may ever take a click meant
 * for the way in, and the surest way to guarantee that is for none of it to be
 * clickable.
 */
export function LandingScene() {
  return (
    <div className={styles.scene} aria-hidden="true">
      {/* --- BACKGROUND: sky, and the country at the edge of seeing -------- */}
      <div className={styles.sky} />

      <div className={`${styles.band} ${styles.far}`}>
        <svg viewBox={`0 0 ${FRONTIER_WIDTH} ${FRONTIER_HEIGHT}`} preserveAspectRatio="xMidYMax slice">
          <path d={terrain.mountains.silhouettes[0]} />
        </svg>
      </div>

      <div className={`${styles.band} ${styles.mid}`}>
        <svg viewBox={`0 0 ${FRONTIER_WIDTH} ${FRONTIER_HEIGHT}`} preserveAspectRatio="xMidYMax slice">
          <path d={terrain.mountains.silhouettes[1]} />
        </svg>
      </div>

      {/*
        §31, §32: the trail, and the thread of smoke it runs toward.

        One line and one column, both faint, neither explained. A visitor who
        reaches Camp later should be able to look back at this and realise the
        landscape was pointing at it the whole time. Said quietly enough that
        noticing it is the reader's own.
      */}
      <div className={styles.trail}>
        <svg viewBox={`0 0 ${FRONTIER_WIDTH} ${FRONTIER_HEIGHT}`} preserveAspectRatio="xMidYMax slice">
          <path d={trail.d} className={styles.trailLine} />
          <g className={styles.smoke} style={{ "--sx": `${trail.smoke.x}`, "--sy": `${trail.smoke.y}` } as React.CSSProperties}>
            <path d={`M ${trail.smoke.x} ${trail.smoke.y} C ${trail.smoke.x - 6} ${trail.smoke.y - 26}, ${trail.smoke.x + 8} ${trail.smoke.y - 44}, ${trail.smoke.x + 2} ${trail.smoke.y - 72}`} />
          </g>
        </svg>
      </div>

      {/*
        --- MIDGROUND ---

        The rider and the herd belong here and are not here.

        Three attempts at drawing a horse as bezier path data were made and
        all three were verified at size: the first read as a dog, the second
        and third as a brontosaurus — a neck too thick, a barrel too deep, a
        head that would not resolve. Authoring convincing animal silhouettes
        by typing coordinates without a visual editor is not something this
        pass could do, and a landing page is the wrong place to find that out
        in production.

        What is needed to finish §3-§9 is artwork, not code: a horse and rider
        silhouette (SVG path, side profile, facing right, with the legs as
        separate joints), or a licensed rigged model if the scene is to become
        3D. Everything around it is built and waiting — lib/world/frontier.ts
        holds the rider's path, the herd's six seeded variations and the dust,
        and the placement, gait timing, tone-by-distance, occlusion, quality
        tiers and reduced-motion behaviour were all written against it.
      */}
      <div className={`${styles.band} ${styles.near}`}>
        <svg viewBox={`0 0 ${FRONTIER_WIDTH} ${FRONTIER_HEIGHT}`} preserveAspectRatio="xMidYMax slice">
          <path d={terrain.mountains.silhouettes[2]} />
        </svg>
      </div>

      {/* --- THE AIR -------------------------------------------------------
          §18: dust that occasionally catches the light and goes out again.
          Seeded positions, so the motes do not reshuffle on every render. */}
      <div className={styles.dust}>
        {dust.map((mote, i) => (
          <span
            key={i}
            className={styles.mote}
            style={
              {
                "--x": `${mote.x}%`,
                "--y": `${mote.y}%`,
                "--size": `${mote.size}px`,
                "--float": `${mote.duration}s`,
                "--delay": `${mote.delay}s`,
                "--drift": `${mote.drift}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* The low sun's wash across the whole frame, and the vignette that
          keeps the corners quiet so the wordmark has somewhere to sit. */}
      <div className={styles.light} />
      <div className={styles.vignette} />
    </div>
  );
}
