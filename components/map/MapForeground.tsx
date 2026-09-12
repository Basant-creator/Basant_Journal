import { SceneLayer } from "@/components/scene/SceneLayer";
import { VISTA_HEIGHT, VISTA_WIDTH, buildGround, buildScrub } from "@/lib/world/vista";
import styles from "./MapForeground.module.css";

const ground = buildGround();
const scrub = buildScrub();

/**
 * The ground the reader is standing on.
 *
 * Painted over the sheet, which is the point: a silhouette that crosses an
 * edge is the cheapest and most convincing depth cue there is, and it is what
 * turns the survey sheet from a panel with a picture behind it into an object
 * with something in front of it.
 *
 * What it costs the map is bounded by the generator — no blade rises more
 * than eighteen units above the sheet's bottom edge, and none grows tall over
 * the scale bar. What it costs interaction is nothing: the whole layer
 * refuses pointer events, so every marker, trail and hit area underneath
 * behaves exactly as it did before this existed.
 */
export function MapForeground() {
  return (
    <div className={styles.foreground} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox={`0 0 ${VISTA_WIDTH} ${VISTA_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {/* Scrub first, then the bank over it: the blades have to come up
            from behind the ground line, not sit on top of it. */}
        <SceneLayer depth={6} name="scrub" verticalRatio={0.3}>
          <g className={styles.blades}>
            {scrub.map((blade, index) => (
              <path key={`blade-${index}`} d={blade.d} strokeWidth={blade.width} />
            ))}
          </g>
          <path className={styles.ground} d={ground} />
        </SceneLayer>
      </svg>

      {/* Corners fall away. A vignette is doing lens work here, not mood work:
          it keeps the frame's edges from competing with the sheet's own. */}
      <span className={styles.vignette} />
    </div>
  );
}
