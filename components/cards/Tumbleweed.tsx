import { createRng, seedFrom } from "@/lib/cards/rng";
import styles from "./titles.module.css";

/* Two decimals, so the server and the browser draw the same scribble. */
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A tumbleweed, drawn the way one is made: a ball of crossing curves, from a
 * seeded stream so it is the same on every load. It rolls across the card it
 * sits on now and then (titles.module.css), only while that card is the one
 * on screen, and not at all on a still machine or with reduced motion.
 *
 * Three nested boxes so each motion is one transform the compositor can run:
 * the roll across, the hop, and the spin. The drawing itself never changes.
 */
export function Tumbleweed() {
  const rng = createRng(seedFrom("tumbleweed"));
  const point = (radius: number) => {
    const a = rng.range(0, Math.PI * 2);
    const d = radius * Math.sqrt(rng.range(0.35, 1));
    return `${r2(50 + d * Math.cos(a))} ${r2(50 + d * Math.sin(a))}`;
  };
  let d = "";
  for (let k = 0; k < 34; k++) d += `M${point(44)} Q${point(30)} ${point(44)} `;
  return (
    <span className={styles.tumble} aria-hidden="true">
      <span className={styles.hop}>
        <span className={styles.spin}>
          <svg viewBox="0 0 100 100">
            <path d={d.trim()} />
          </svg>
        </span>
      </span>
    </span>
  );
}
