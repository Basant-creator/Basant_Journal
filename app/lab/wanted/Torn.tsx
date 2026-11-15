import { createRng, seedFrom } from "@/lib/map/rng";
import styles from "./partition.module.css";

const W = 1600;
const H = 48;
const round = (n: number) => Math.round(n * 100) / 100;

/* A torn edge: a ragged line across the width, small tears on a slower
   wander, and a pale fringe a little proud of it where the fibres show. */
function edge(seed: string) {
  const rng = createRng(seedFrom(seed));
  const pts: [number, number][] = [];
  let y = H * 0.5;
  for (let x = 0; x <= W; x += rng.range(6, 22)) {
    y += rng.jitter(5);
    y = Math.min(H * 0.82, Math.max(H * 0.2, y));
    pts.push([round(x), round(y + rng.jitter(2.5))]);
  }
  pts.push([W, round(y)]);
  const line = pts.map(([x, py]) => `${x},${py}`).join(" L");
  const fringe = pts.map(([x, py]) => `${x},${round(py - 2.4 - rng.next() * 2.2)}`).join(" L");
  return {
    paper: `M0,${H} L${line} L${W},${H} Z`,
    fringe: `M0,${H} L${fringe} L${W},${H} Z`,
  };
}

/**
 * The edge of a paper band, torn rather than ruled: sits on the band's top
 * (or, flipped, its foot) and is filled with the band's own colour, so the
 * paper looks torn off against the dark it meets.
 */
export function Torn({ seed, side }: { seed: string; side: "top" | "bottom" }) {
  const { paper, fringe } = edge(seed);
  return (
    <svg className={styles.torn} data-side={side} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <path d={fringe} className={styles.fringe} />
      <path d={paper} className={styles.tornPaper} />
    </svg>
  );
}
