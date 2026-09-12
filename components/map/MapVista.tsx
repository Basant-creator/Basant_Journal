import { SceneLayer } from "@/components/scene/SceneLayer";
import { VISTA_HEIGHT, VISTA_WIDTH, buildRidges } from "@/lib/world/vista";
import styles from "./MapVista.module.css";

/* Generated once, at module scope, exactly like the map's own terrain: the
   ridges are a fixed feature of this place, not per-render noise. */
const ridges = buildRidges();

/**
 * The country behind the sheet.
 *
 * Three ridgelines at three depths, each one darker and lower than the last,
 * with a wash of dusk settling in front of it. That wash is the whole trick —
 * aerial perspective is what tells an eye that something is far away, and it
 * is the reason three flat silhouettes read as distance rather than as three
 * flat silhouettes.
 *
 * Decorative throughout. The map is the content; this is the room it hangs
 * in, so it is aria-hidden and never takes a pointer event.
 */
export function MapVista() {
  return (
    <div className={styles.vista} aria-hidden="true">
      <svg
        className={styles.art}
        viewBox={`0 0 ${VISTA_WIDTH} ${VISTA_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <linearGradient id="vista-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className={styles.hazeDense} />
            <stop offset="1" className={styles.hazeClear} />
          </linearGradient>
        </defs>

        {ridges.map((ridge, index) => (
          <SceneLayer
            key={`ridge-${index}`}
            depth={index as 0 | 1 | 2}
            name={`ridge-${index}`}
            /* Distance moves less than height does: a far ridge barely shifts
               at all, which is what makes it read as far. */
            verticalRatio={0.24}
          >
            <path className={styles[`ridge${index}`]} d={ridge.path} />
            <rect
              className={styles[`haze${index}`]}
              x={-80}
              y={ridge.crestY - 34}
              width={VISTA_WIDTH + 160}
              height={190}
              fill="url(#vista-haze)"
            />
          </SceneLayer>
        ))}
      </svg>

      {/* The last of the light, caught on the sheet. Also what keeps the
          ground behind the paper from going flat. */}
      <span className={styles.glow} />
    </div>
  );
}
