import type { CSSProperties } from "react";
import { createRng, seedFrom } from "@/lib/map/rng";
import { Shot } from "./Shot";
import styles from "./board.module.css";

export type Group = { group: string; items: { name: string; projects: string[] }[] };

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A torn edge: points walked round the sheet, each pulled in by a little,
 * and one corner bitten off where it was ripped from an older nail.
 * Percentages, for clip-path. Seeded, so it tears the same every visit.
 */
function torn(label: string): string {
  const rng = createRng(seedFrom(label));
  const pts: string[] = [];
  const bite = Math.floor(rng.range(0, 4));
  const edge = (from: [number, number], to: [number, number], inward: [number, number], n: number) => {
    for (let k = 0; k < n; k += 1) {
      const t = k / n;
      const depth = rng.range(0, 2.2) + (rng.chance(0.15) ? rng.range(1.5, 3.5) : 0);
      pts.push(`${r2(from[0] + (to[0] - from[0]) * t + inward[0] * depth)}% ${r2(from[1] + (to[1] - from[1]) * t + inward[1] * depth)}%`);
    }
  };
  const corners: [number, number][] = [
    [0, 0],
    [100, 0],
    [100, 100],
    [0, 100],
  ];
  const inward: [number, number][] = [
    [0, 1],
    [-1, 0],
    [0, -1],
    [1, 0],
  ];
  for (let side = 0; side < 4; side += 1) {
    const a = corners[side];
    const b = corners[(side + 1) % 4];
    if (side === bite) {
      /* The bitten corner: the side starts well in from the corner. */
      const along: [number, number] = [a[0] + (b[0] - a[0]) * 0.16, a[1] + (b[1] - a[1]) * 0.16];
      const down: [number, number] = [a[0] + inward[(side + 3) % 4][0] * 13, a[1] + inward[(side + 3) % 4][1] * 13];
      pts.push(`${r2(down[0])}% ${r2(down[1])}%`);
      edge(along, b, inward[side], 10);
    } else {
      edge(a, b, inward[side], 12);
    }
  }
  return `polygon(${pts.join(", ")})`;
}

/* The planks: unequal widths, each its own shade of weathered grey-brown,
   with a knot here and there. */
const PLANKS = (() => {
  const rng = createRng(seedFrom("board-planks"));
  const widths = Array.from({ length: 7 }, () => rng.range(11, 17));
  const total = widths.reduce((a, b) => a + b, 0);
  return widths.map((w) => ({
    w: r2((w / total) * 100),
    grey: r2(rng.range(18, 46)),
    dark: r2(rng.range(0, 22)),
    knot: rng.chance(0.6) ? { x: r2(rng.range(25, 75)), y: r2(rng.range(10, 90)) } : null,
    rot: rng.chance(0.5) ? r2(rng.range(70, 96)) : null,
  }));
})();

/* Older bills, mostly torn away: their scraps are still under the nails. */
const SCRAPS = [
  { x: 4, y: 6, w: 9, h: 12, r: -6 },
  { x: 47, y: 2, w: 7, h: 9, r: 8 },
  { x: 88, y: 48, w: 9, h: 14, r: -3 },
  { x: 30, y: 88, w: 11, h: 8, r: 4 },
];

/**
 * The tools, as bills on a notice board: the kind that stood outside a
 * frontier store, its planks gone grey and soft at the foot where the rain
 * sits, rust running down from every nail. Each kind of tool is its own
 * bill, foxed and stained and torn, nailed over the scraps of older ones.
 * Dots count the projects a tool was used in; a tool no project has used
 * yet is printed faint.
 */
export function NoticeBoard({ groups }: { groups: Group[] }) {
  const tilt = createRng(seedFrom("board-bills"));
  return (
    <Shot className={styles.scene} light="35% 0%">
      <div className={styles.planks} aria-hidden="true">
        {PLANKS.map((p, i) => (
          <span
            key={i}
            className={styles.plank}
            style={{ "--w": `${p.w}%`, "--grey": `${p.grey}%`, "--dark": `${p.dark}%`, "--rot": p.rot ? `${p.rot}%` : "120%" } as CSSProperties}
          >
            {p.knot ? <span className={styles.knot} style={{ left: `${p.knot.x}%`, top: `${p.knot.y}%` } as CSSProperties} /> : null}
          </span>
        ))}
      </div>

      {SCRAPS.map((s, i) => (
        <span
          key={i}
          className={styles.scrap}
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: `${s.w}%`, height: `${s.h}%`, rotate: `${s.r}deg`, clipPath: torn(`scrap-${i}`) } as CSSProperties}
          aria-hidden="true"
        />
      ))}

      <div className={styles.bills}>
        {groups.map((g) => {
          const used = g.items.filter((it) => it.projects.length).length;
          return (
            <article key={g.group} className={styles.bill} style={{ "--tilt": `${r2(tilt.jitter(2.6))}deg` } as CSSProperties}>
              <div className={styles.paper} style={{ clipPath: torn(`bill-${g.group}`) } as CSSProperties}>
                <span className={styles.stains} aria-hidden="true" />
                <h4 className={styles.billTitle}>{g.group}</h4>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.name} data-faint={it.projects.length ? undefined : ""}>
                      <span>{it.name}</span>
                      <span className={styles.dots} aria-label={`used in ${it.projects.length} project${it.projects.length === 1 ? "" : "s"}`}>
                        {"●".repeat(it.projects.length)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className={styles.billFoot}>
                  {used} of {g.items.length} put to work
                </p>
                <span className={styles.bleed} aria-hidden="true" />
              </div>
              <span className={styles.nail} aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </Shot>
  );
}
