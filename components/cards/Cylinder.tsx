import type { CSSProperties } from "react";
import styles from "./titles.module.css";

/* Two decimals, so the server and the browser draw the same numbers
   (CLAUDE.md: round every generated coordinate). */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The count, as a revolver's cylinder: one chamber per card, the one on
 * screen turned to the top under the frame's notch, and a round loaded in
 * every chamber whose card has been seen. A cut turns it one chamber; the
 * way home spins it all the way back.
 *
 * The whole drawing turns, as an element, so the compositor moves it and
 * nothing inside the SVG is repainted (CLAUDE.md: an animation inside an
 * SVG repaints all of it). Decoration: the count is announced elsewhere.
 */
export function Cylinder({ count, at, loaded }: { count: number; at: number; loaded: boolean[] }) {
  const step = 360 / count;
  const chambers = Array.from({ length: count }, (_, k) => {
    const a = ((k * step - 90) * Math.PI) / 180;
    return { x: r2(27 * Math.cos(a)), y: r2(27 * Math.sin(a)) };
  });
  const flutes = Array.from({ length: count }, (_, k) => {
    const a = (((k + 0.5) * step - 90) * Math.PI) / 180;
    return { x: r2(46 * Math.cos(a)), y: r2(46 * Math.sin(a)) };
  });
  return (
    <span className={styles.cylinder} aria-hidden="true">
      <span className={styles.notch} />
      <svg className={styles.drum} viewBox="-50 -50 100 100" style={{ "--turn": `${r2(-at * step)}deg` } as CSSProperties}>
        <circle r="46" className={styles.rim} />
        {flutes.map((f, k) => (
          <circle key={k} cx={f.x} cy={f.y} r="6.5" className={styles.flute} />
        ))}
        {chambers.map((c, k) => (
          <circle key={k} cx={c.x} cy={c.y} r="9" className={loaded[k] ? styles.round : styles.chamber} />
        ))}
        <circle r="6" className={styles.hub} />
      </svg>
    </span>
  );
}
