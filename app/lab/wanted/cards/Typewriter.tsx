"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { triggerTypeKey, triggerTypeReturn } from "@/lib/audio/atmosphere";
import { Shot } from "./Shot";
import styles from "./typewriter.module.css";

export type TypeGroup = { group: string; items: { name: string; projects: string[] }[] };
export type TypeProject = { id: string; title: string };

const COLUMNS = 42;
const KEY_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

/* The sheet for a project, or for everything: a heading, then a line for
   each kind of tool, wrapped at the margin with a hanging indent. */
function sheet(groups: TypeGroup[], project: TypeProject | null): string[] {
  const lines = [project ? `${project.title}: the tools` : "The tools", ""];
  for (const g of groups) {
    const items = project ? g.items.filter((it) => it.projects.includes(project.id)) : g.items;
    if (!items.length) continue;
    const words = `${g.group.toUpperCase()}: ${items.map((it) => it.name).join(", ")}.`.split(" ");
    let line = "";
    for (const w of words) {
      if ((line + " " + w).trim().length > COLUMNS) {
        lines.push(line);
        line = `  ${w}`;
      } else {
        line = line ? `${line} ${w}` : w;
      }
    }
    lines.push(line);
  }
  return lines;
}

/* Struck by hand, so no two letters land quite alike. Seeded by position. */
const strike = (i: number) => {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12345.678;
  const u = a - Math.floor(a);
  const v = b - Math.floor(b);
  return { y: Math.round((u - 0.5) * 12) / 100, o: Math.round((0.72 + v * 0.28) * 100) / 100 };
};

/**
 * The tools, typed. A typewriter on a desk, a fresh sheet in it; choose a
 * project (or everything) and the sheet is typed out a key at a time: the
 * carriage steps left with every letter, the bell rings near the end of a
 * line, the carriage is thrown back and the paper feeds up a line. Choosing
 * again pulls the sheet and types a new one. Click the sheet to have the
 * rest typed at once.
 *
 * With reduced motion the sheet is simply typed.
 */
export function Typewriter({ groups, projects }: { groups: TypeGroup[]; projects: TypeProject[] }) {
  const [project, setProject] = useState<TypeProject | null>(null);
  const [typed, setTyped] = useState<string[]>([]);
  const [leaving, setLeaving] = useState(false);
  const target = useRef<string[]>([]);
  const timer = useRef(0);
  const started = useRef(false);
  const keys = useRef(new Map<string, HTMLElement>());

  const still = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "still";

  const press = (c: string) => {
    const key = keys.current.get(c === " " ? " " : c.toUpperCase());
    if (!key) return;
    key.setAttribute("data-down", "");
    window.setTimeout(() => key.removeAttribute("data-down"), 90);
  };

  const type = useCallback((lines: string[]) => {
    window.clearTimeout(timer.current);
    target.current = lines;
    if (still()) {
      setTyped(lines);
      return;
    }
    let line = 0;
    let col = 0;
    setTyped([""]);
    const step = () => {
      const text = target.current[line];
      if (text === undefined) return;
      if (col < text.length) {
        const c = text[col];
        col += 1;
        const done = text.slice(0, col);
        setTyped((prev) => [...prev.slice(0, line), done]);
        if (c !== " ") {
          press(c);
          triggerTypeKey();
        } else press(" ");
        timer.current = window.setTimeout(step, 16 + Math.random() * 30 + (c === "," || c === ":" ? 50 : 0));
        return;
      }
      line += 1;
      col = 0;
      if (line >= target.current.length) return;
      triggerTypeReturn();
      timer.current = window.setTimeout(() => {
        setTyped((prev) => [...prev, ""]);
        timer.current = window.setTimeout(step, 180);
      }, 340);
    };
    timer.current = window.setTimeout(step, 500);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const choose = (p: TypeProject | null) => {
    if (p?.id === project?.id) return;
    setProject(p);
    window.clearTimeout(timer.current);
    if (still()) {
      type(sheet(groups, p));
      return;
    }
    setLeaving(true);
    timer.current = window.setTimeout(() => {
      setLeaving(false);
      type(sheet(groups, p));
    }, 520);
  };

  const finish = () => {
    window.clearTimeout(timer.current);
    setTyped(target.current);
  };

  const current = typed[typed.length - 1] ?? "";
  let index = 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.filter} role="group" aria-label="Type the tools for">
        <button type="button" aria-pressed={project === null} onClick={() => choose(null)}>
          Everything
        </button>
        {projects.map((p) => (
          <button key={p.id} type="button" aria-pressed={project?.id === p.id} onClick={() => choose(p)}>
            {p.title}
          </button>
        ))}
      </div>

      <Shot
        className={styles.scene}
        light="50% 20%"
        onSeen={() => {
          if (started.current) return;
          started.current = true;
          type(sheet(groups, null));
        }}
      >
        <span className={styles.desk} aria-hidden="true" />

        <div
          className={styles.carriage}
          style={{ "--col": current.length } as CSSProperties}
          data-return={current.length === 0 && typed.length > 1 ? "" : undefined}
          data-done={typed.length === target.current.length && current === target.current[target.current.length - 1] ? "" : undefined}
        >
          <div
            className={styles.paper}
            data-leaving={leaving ? "" : undefined}
            role="button"
            tabIndex={0}
            aria-label="Type the rest at once"
            onClick={finish}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && finish()}
          >
            <p className={styles.sheet} aria-label={target.current.join(" ")}>
              {typed.map((line, l) => (
                <span key={l} className={styles.typed} aria-hidden="true">
                  {line.split("").map((c) => {
                    const s = strike(index++);
                    return (
                      <span key={index} style={{ translate: `0 ${s.y}em`, opacity: s.o } as CSSProperties}>
                        {c}
                      </span>
                    );
                  })}
                  {"​"}
                </span>
              ))}
            </p>
          </div>
          <span className={styles.bail} aria-hidden="true" />
          <span className={styles.platen} aria-hidden="true" />
          <span className={`${styles.knob} ${styles.knobLeft}`} aria-hidden="true" />
          <span className={`${styles.knob} ${styles.knobRight}`} aria-hidden="true" />
        </div>

        <span className={styles.guide} aria-hidden="true" />

        <div className={styles.machine} aria-hidden="true">
          <span className={styles.basket} />
          <span className={styles.body}>
            <span className={styles.decal}>The Frontier</span>
          </span>
          <span className={styles.keys}>
            {KEY_ROWS.map((row) => (
              <span key={row} className={styles.row}>
                {row.split("").map((k) => (
                  <span
                    key={k}
                    ref={(el) => {
                      if (el) keys.current.set(k, el);
                    }}
                    className={styles.key}
                  >
                    {k}
                  </span>
                ))}
              </span>
            ))}
            <span
              ref={(el) => {
                if (el) keys.current.set(" ", el);
              }}
              className={styles.space}
            />
          </span>
        </div>
      </Shot>
    </div>
  );
}
