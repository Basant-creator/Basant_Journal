import styles from "./SceneAtmosphere.module.css";

interface SceneAtmosphereProps {
  /** `still` is haze only; `drift` adds dust. Dust is for scenes, not pages. */
  variant?: "still" | "drift";
  className?: string;
}

/**
 * The air in a scene.
 *
 * Three layers of motes at different depths and speeds, plus a slow haze. It
 * is CSS gradients, not a particle system: no canvas, no per-frame JavaScript,
 * nothing to leak when a route changes. The whole thing is composited on the
 * GPU and costs nothing on the main thread.
 *
 * Kept far below the threshold of noticing — a mote crosses the viewport over
 * about a minute. The brief's warning applies: the world should feel alive
 * without announcing that someone discovered CSS transforms. Off entirely
 * under reduced motion and on phones.
 */
export function SceneAtmosphere({ variant = "drift", className }: SceneAtmosphereProps) {
  return (
    <div
      className={[styles.air, styles[variant], className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <span className={styles.haze} />
      {variant === "drift" ? (
        <>
          <span className={`${styles.motes} ${styles.far}`} />
          <span className={`${styles.motes} ${styles.mid}`} />
          <span className={`${styles.motes} ${styles.near}`} />
        </>
      ) : null}
    </div>
  );
}
