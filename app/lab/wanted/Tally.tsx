"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import styles from "./tally.module.css";

/* How often a mark may be chalked: no faster than a hand could. */
const MARK_MS = 260;

/* The three voices the opening sets its words in, by their tokens. */
const FACES = ["--font-display", "--font-editorial", "--font-ui"];

/* Arrived this visit already: a page the visitor comes back to is not
   loaded again, and does not pretend to be. Module state, so a reload
   starts over and a client-side return does not. */
let arrivedOnce = false;

/**
 * The tally of what has really come in, and only what the opening itself
 * needs: its three typefaces, its drawing (`drawing`, reported by the
 * Reveal that fetched it, so it is fetched once) and its photograph (the
 * first `img` inside `frame`). One mark per thing, shown no faster than one
 * every MARK_MS; `ready` a beat after the last.
 *
 * The chapters' pictures are not waited for: each is fetched as it comes
 * near (Reveal), so the first screen costs what the first screen shows.
 * Whatever fails still counts as in: a missing picture never holds the
 * page shut.
 */
export function useArrivals(
  frame: RefObject<HTMLElement | null>,
  { once = false, drawing = false }: { once?: boolean; drawing?: boolean } = {},
) {
  const total = FACES.length + 2;
  const drawingIn = useRef<() => void>(null);
  const [state, setState] = useState(() => (once && arrivedOnce ? { count: total, ready: true } : { count: 0, ready: false }));

  useEffect(() => {
    if (state.ready) return;
    let cancelled = false;
    const started = performance.now();
    let shown = 0;
    let arrived = 0;
    const timers: number[] = [];
    const tick = () => {
      if (cancelled) return;
      if (shown < arrived && performance.now() - started >= (shown + 1) * MARK_MS) {
        shown += 1;
        setState({ count: shown, ready: false });
      }
      if (shown < total) timers.push(window.setTimeout(tick, 60));
      else
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            if (once) arrivedOnce = true;
            setState({ count: total, ready: true });
          }, 350),
        );
    };
    const arrive = () => {
      arrived += 1;
    };
    const photo = () =>
      new Promise<void>((resolve) => {
        const img = frame.current?.querySelector("img");
        if (!img || (img.complete && img.naturalWidth)) return resolve();
        img.addEventListener("load", () => resolve(), { once: true });
        img.addEventListener("error", () => resolve(), { once: true });
      });
    const css = getComputedStyle(frame.current ?? document.documentElement);
    for (const face of FACES) {
      const family = css.getPropertyValue(face).trim();
      (family ? document.fonts.load(`1em ${family}`) : Promise.resolve()).then(arrive, arrive);
    }
    let drawn = false;
    drawingIn.current = () => {
      if (drawn) return;
      drawn = true;
      arrive();
    };
    photo().then(arrive);
    tick();
    return () => {
      cancelled = true;
      drawingIn.current = null;
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount; `ready` only ever ends it
  }, []);

  useEffect(() => {
    if (drawing) drawingIn.current?.();
  }, [drawing]);

  return { ...state, total };
}

/* A tally's strokes: four upright, the fifth across them, then on again. */
export function TallyMarks({ count, total, className }: { count: number; total: number; className?: string }) {
  return (
    <svg className={`${styles.marks} ${className ?? ""}`} viewBox={`0 0 ${total * 11 + 20} 40`} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => {
        const group = Math.floor(i / 5);
        const k = i % 5;
        const x = 6 + group * 62 + k * 11;
        const d = k === 4 ? `M${x - 46},30 L${x + 2},8` : `M${x},${6 + (k % 2)} L${x - 1 + (k % 3) * 0.6},${33 - (k % 2)}`;
        return <path key={i} d={d} pathLength={1} data-on={i < count ? "" : undefined} />;
      })}
    </svg>
  );
}

/* Three slightly different wobbles for chalk lines that are alive the way a
   hand-drawn film's are, swapped a few times a second (the `boil` class). */
export function BoilFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      {[1, 2, 3].map((seed) => (
        <filter key={seed} id={`chalk-boil-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed={seed * 7} />
          <feDisplacementMap in="SourceGraphic" scale="5" />
        </filter>
      ))}
    </svg>
  );
}

export const boil = styles.boil;
