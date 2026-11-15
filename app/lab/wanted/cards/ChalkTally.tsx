"use client";

import { useRef, type CSSProperties } from "react";
import { Shot } from "./Shot";
import styles from "./chalk.module.css";
import { useDepth } from "./useDepth";

export type TallyGroup = {
  group: string;
  items: { name: string; projects: string[] }[];
};

/* A tally, the way a bar keeps one: a stroke for each, and the fifth
   across the four. Drawn as chalk lines, each a little off true. */
function Tally({ count }: { count: number }) {
  if (!count) return <span className={styles.none}>none yet</span>;
  return (
    <svg className={styles.tally} viewBox={`0 0 ${count * 9 + 4} 24`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <path key={i} d={`M${4 + i * 9},${3 + (i % 2)} L${3 + i * 9 + (i % 3) * 0.6},${21 - (i % 2)}`} />
      ))}
      {count >= 5 ? <path d={`M1,18 L${count * 9},5`} /> : null}
    </svg>
  );
}

/**
 * The tools as a saloon's slate: the board on the wall behind the bar where
 * the tab was kept, in a battered frame, chalk dust in the corners and the
 * ghosts of old tabs rubbed out across it. The room is there round it: the
 * plank wall, a lamp either side, smoke in the air, and the near edge of
 * the bar with a glass and a bottle on it, too close to be in focus. The
 * pointer moves the room at its depths and turns the board a little.
 *
 * Each kind of tool is chalked up under its own heading, and each tool
 * against the projects that have run it up, with a tally of how many. It
 * is chalked up line by line as you come to it (read off the scroll), and
 * a browser that cannot follow the scroll shows it written.
 */
export function ChalkTally({ groups, titles }: { groups: TallyGroup[]; titles: Record<string, string> }) {
  const room = useRef<HTMLDivElement>(null);
  useDepth(room);
  const half = Math.ceil(groups.length / 2);
  const columns = [groups.slice(0, half), groups.slice(half)];
  return (
    <Shot className={styles.scene} light="50% 0%">
      <div ref={room} className={styles.room}>
        <span data-depth="" className={styles.wall} aria-hidden="true" />
        <span data-depth="" className={`${styles.sconce} ${styles.sconceLeft}`} aria-hidden="true" />
        <span data-depth="" className={`${styles.sconce} ${styles.sconceRight}`} aria-hidden="true" />
        <span className={styles.smoke} data-loop="" aria-hidden="true" />
        <div data-depth="" className={styles.hang}>
          <span className={styles.wire} aria-hidden="true" />
          <div className={styles.frame}>
            <div className={styles.slate}>
              <span className={styles.ghosts} aria-hidden="true" />
              <h4 className={styles.head} data-enter="">The Tab</h4>
              <p className={styles.sub} data-enter="">Tools, and what ran them up</p>
              <div className={styles.columns}>
                {columns.map((col, c) => (
                  <div key={c} className={styles.column}>
                    {col.map((g) => (
                      <section key={g.group} className={styles.group}>
                        <h5 className={styles.groupName} data-enter="">{g.group}</h5>
                        <ul>
                          {g.items.map((it, i) => (
                            <li key={it.name} className={styles.entry} data-enter="" data-faint={it.projects.length ? undefined : ""} style={{ "--i": i } as CSSProperties}>
                              <span className={styles.name}>{it.name}</span>
                              <span className={styles.leader} aria-hidden="true" />
                              <span className={styles.by}>{it.projects.map((id) => titles[id] ?? id).join(", ")}</span>
                              <Tally count={it.projects.length} />
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.tray} aria-hidden="true">
              <span className={styles.stick} />
              <span className={styles.duster} />
            </div>
          </div>
        </div>
        <div data-depth="" className={styles.bar} aria-hidden="true">
          <svg className={styles.glass} viewBox="0 0 100 110">
            <path className={styles.whiskey} d="M14,56 L86,56 L82,100 Q80,106 74,106 L26,106 Q20,106 18,100 Z" />
            <path className={styles.tumbler} d="M8,8 L92,8 L84,102 Q82,110 74,110 L26,110 Q18,110 16,102 Z" />
            <path className={styles.shine} d="M20,14 L26,14 L30,96 L25,96 Z" />
          </svg>
          <svg className={styles.bottle} viewBox="0 0 80 260">
            <path d="M30,0 L50,0 L50,8 L48,10 L48,70 Q48,92 64,108 Q76,120 76,140 L76,252 Q76,260 68,260 L12,260 Q4,260 4,252 L4,140 Q4,120 16,108 Q32,92 32,70 L32,10 L30,8 Z" />
            <path className={styles.label} d="M8,160 L72,160 L72,212 L8,212 Z" />
            <path className={styles.shine} d="M12,130 L18,128 L18,240 L12,240 Z" />
          </svg>
        </div>
      </div>
    </Shot>
  );
}
