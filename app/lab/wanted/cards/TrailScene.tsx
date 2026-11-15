"use client";

import { useEffect, useId, useRef, type CSSProperties } from "react";
import { createRng, seedFrom } from "@/lib/map/rng";
import { qualityOf } from "../quality";
import type { JourneyTrail } from "./journey";
import { Shot } from "./Shot";
import styles from "./trailScene.module.css";
import { useDepth } from "./useDepth";

const r2 = (n: number) => Math.round(n * 100) / 100;

/* A line of hills against the sky, seeded so server and client draw the
   same one; in a 1200 x 200 box, filled down to its foot. */
function ridge(label: string, base: number, rough: number, steps: number): string {
  const rng = createRng(seedFrom(label));
  let y = base;
  let d = `M0,200 L0,${r2(y)}`;
  for (let i = 1; i <= steps; i += 1) {
    y = Math.max(20, Math.min(190, y + rng.jitter(rough)));
    const x = (i / steps) * 1200;
    d += ` Q${r2(x - 600 / steps)},${r2(y + rng.jitter(rough * 0.6))} ${r2(x)},${r2(y)}`;
  }
  return `${d} L1200,200 Z`;
}

const FAR = ridge("trail-ridge-far", 90, 28, 9);
const MID = ridge("trail-ridge-mid", 120, 22, 14);
const NEAR = ridge("trail-ridge-near", 150, 14, 22);

/* Scrub and stones scattered over the ground: sagebrush in dark tufts,
   a pale stone here and there. Positions are percentages of the ground. */
const SCRUB = (() => {
  const rng = createRng(seedFrom("trail-scrub"));
  return Array.from({ length: 90 }, () => ({
    x: r2(rng.range(2, 98)),
    y: r2(rng.range(4, 98)),
    s: r2(rng.range(0.5, 1.6)),
    stone: rng.chance(0.18),
  }));
})();

/**
 * The journey, walked across open country at dusk. The trail is drawn on
 * the ground, a plane laid back in perspective under a low sky and three
 * lines of hills, each further one paler in the haze. Camps and waypoints
 * stand up off the ground on posts, the near ones large and the far ones
 * small. The trail is drawn as you scroll down to it, each checkpoint
 * appearing as the line reaches it; once it is drawn, someone walks it.
 * The pointer moves the layers at their own depths.
 *
 * On a phone the trail turns to run away from you, a road into the
 * distance, its first year at your feet.
 *
 * Left to itself the walker keeps walking the whole trail, pausing at each
 * checkpoint. Given `active` (the milestone being read beside it, see
 * Journey.tsx), it walks instead to that checkpoint along the trail and
 * waits there, and the checkpoint is marked. `contained` keeps it inside
 * its column rather than running out to the page's edges.
 */
export function TrailScene({ trail, active, contained = false }: { trail: JourneyTrail; active?: number | null; contained?: boolean }) {
  const depth = useRef<HTMLDivElement>(null);
  const mask = `trail-${useId().replace(/:/g, "")}`;
  const { nodes, geo, walk } = trail;
  const led = typeof active === "number";
  const route = useRef<SVGPathElement>(null);
  const walker = useRef<SVGGElement>(null);
  /* Where along the trail the walker is, in the drawing's units, so a new
     destination is walked to from wherever it has got to. */
  const along = useRef<number | null>(null);

  useDepth(depth);

  /* Led, the camera follows the reading too: the whole scene eases a few
     degrees of pan toward the checkpoint being read, slower than the walker
     so the walker leads and the view settles after it. One transform on the
     scene's frame per change of checkpoint; nothing for a reader who has
     asked for stillness. */
  useEffect(() => {
    const el = depth.current;
    if (!el) return;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "still";
    if (typeof active !== "number" || still) {
      el.style.removeProperty("translate");
      el.style.removeProperty("scale");
      return;
    }
    const x = nodes[active]?.x ?? 600;
    el.style.scale = "1.06";
    el.style.translate = `${r2(-(x / 1200 - 0.5) * 5)}% 0`;
  }, [active, nodes]);

  /* The walk that walks itself is SMIL, and SMIL is the browser's to run on
     the main thread whether or not anyone can see it: measured on a phone
     profile at a quarter speed, these few circles kept the main thread 98%
     busy with the trail a whole chapter away. So it runs only while the
     trail is on screen, and not at all where nothing should loop (reduced
     motion, a still machine, the low grade), where the walker waits out of
     sight at the start of its walk. */
  const loop = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = loop.current;
    if (led || !svg) return;
    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "still" ||
      qualityOf(svg) === "low";
    if (still) {
      svg.pauseAnimations();
      svg.setCurrentTime(0);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? svg.unpauseAnimations() : svg.pauseAnimations()),
      { root: svg.closest("[data-world]") },
    );
    io.observe(svg);
    return () => io.disconnect();
  }, [led]);

  /* Walked, not jumped: along the trail itself, eased at both ends, at a
     pace proportional to the distance (half a unit a millisecond), and from
     wherever the last walk had reached if it was interrupted. With motion
     asked to be still it is simply there. */
  useEffect(() => {
    if (typeof active !== "number") return;
    const path = route.current;
    const g = walker.current;
    if (!path || !g) return;
    const total = path.getTotalLength();
    const target = (geo.at[active] ?? 0) * total;
    const from = along.current ?? target;
    const place = (len: number) => {
      const pt = path.getPointAtLength(len);
      g.setAttribute("transform", `translate(${r2(pt.x)} ${r2(pt.y)})`);
      along.current = len;
    };
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "still";
    if (still || Math.abs(target - from) < 0.5) {
      place(target);
      return;
    }
    const duration = Math.min(2200, Math.max(500, Math.abs(target - from) / 0.5));
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      place(from + (target - from) * ease(t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, geo.at]);

  return (
    <Shot className={`${styles.scene} ${contained ? styles.contained : ""}`} light="62% 38%" threshold={0.2}>
      <div ref={depth} className={styles.depth}>
        <span data-depth="" className={styles.sky} aria-hidden="true" />
        <span data-depth="" className={styles.sun} aria-hidden="true" />
        <span data-depth="" className={`${styles.cloud} ${styles.cloudA}`} aria-hidden="true" />
        <span data-depth="" className={`${styles.cloud} ${styles.cloudB}`} aria-hidden="true" />
        <svg data-depth="" className={`${styles.ridge} ${styles.far}`} viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
          <path d={FAR} />
        </svg>
        <svg data-depth="" className={`${styles.ridge} ${styles.mid}`} viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
          <path d={MID} />
        </svg>
        <span className={styles.plain} aria-hidden="true" />
        <span className={styles.mist} aria-hidden="true" />
        <svg data-depth="" className={`${styles.ridge} ${styles.near}`} viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
          <path d={NEAR} />
        </svg>

        <div className={styles.stage}>
          <div data-depth="" className={styles.ground}>
            <span className={styles.soil} aria-hidden="true" />
            <span className={styles.scrubField} aria-hidden="true">
              {SCRUB.map((t, i) => (
                <span
                  key={i}
                  className={t.stone ? styles.stone : styles.scrub}
                  style={{ left: `${t.x}%`, top: `${t.y}%`, "--s": t.s } as CSSProperties}
                />
              ))}
            </span>
            <div className={styles.map}>
              <svg className={styles.line} viewBox="0 0 1200 440" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <mask id={mask} maskUnits="userSpaceOnUse" x="-60" y="-60" width="1320" height="560">
                    <path d={geo.d} className={styles.reveal} pathLength={1} />
                  </mask>
                </defs>
                <path d={geo.d} className={styles.trodden} />
                <path d={geo.d} className={styles.rut} />
                <path d={geo.d} className={styles.dashes} mask={`url(#${mask})`} />
              </svg>

              {nodes.map((n, i) => (
                <div
                  key={i}
                  className={styles.mark}
                  data-camp={n.kind === "camp" ? "" : undefined}
                  data-here={led && active === i ? "" : undefined}
                  style={
                    {
                      left: `${(n.x / 1200) * 100}%`,
                      top: `${(n.y / 440) * 100}%`,
                      "--f": geo.at[i],
                      "--far": r2(1 - n.y / 440),
                    } as CSSProperties
                  }
                >
                  <span className={styles.spot} aria-hidden="true" />
                  <span className={styles.stand}>
                    {n.kind === "camp" ? (
                      <>
                        <span className={styles.label}>
                          <span className={styles.year}>{n.year}</span>
                          <span className={styles.name}>{n.title}</span>
                        </span>
                        <span className={styles.tent} aria-hidden="true">
                          <span className={styles.fire} />
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={styles.label}>
                          <span className={styles.when}>{n.when}</span>
                          <span className={styles.what}>{n.what}</span>
                        </span>
                        <span className={styles.post} aria-hidden="true" />
                      </>
                    )}
                  </span>
                </div>
              ))}

              <svg ref={loop} className={styles.walker} viewBox="0 0 1200 440" preserveAspectRatio="none" aria-hidden="true">
                {led ? (
                  <>
                    <path ref={route} d={geo.d} fill="none" stroke="none" />
                    <g ref={walker} transform={`translate(${nodes[0]?.x ?? 0} ${nodes[0]?.y ?? 0})`}>
                      <circle r={13} className={styles.halo} />
                      <circle r={4} className={styles.core} />
                    </g>
                  </>
                ) : (
                  <>
                    {nodes.map((n, i) => {
                      const a = Math.max(0.001, walk.arrive[i]);
                      const fade = Math.min(0.9995, a + 0.04);
                      const times = `0;${(a - 0.0005).toFixed(4)};${a};${fade};1`;
                      return (
                        <circle key={i} cx={n.x} cy={n.y} r={8} className={styles.ping}>
                          <animate attributeName="r" dur={walk.dur} repeatCount="indefinite" keyTimes={times} values="8;8;8;40;40" />
                          <animate attributeName="opacity" dur={walk.dur} repeatCount="indefinite" keyTimes={times} values="0;0;0.9;0;0" />
                        </circle>
                      );
                    })}
                    <g>
                      <circle r={13} className={styles.halo} />
                      <circle r={4} className={styles.core} />
                      <animateMotion
                        dur={walk.dur}
                        repeatCount="indefinite"
                        path={geo.d}
                        calcMode="spline"
                        keyPoints={walk.keyPoints}
                        keyTimes={walk.keyTimes}
                        keySplines={walk.keySplines}
                      />
                      <animate attributeName="opacity" dur={walk.dur} repeatCount="indefinite" keyTimes="0;0.02;0.98;1" values="0;1;1;0" />
                    </g>
                  </>
                )}
              </svg>
            </div>
          </div>
        </div>

        <span className={`${styles.dust} ${styles.dustA}`} data-loop="" aria-hidden="true" />
        <span className={`${styles.dust} ${styles.dustB}`} data-loop="" aria-hidden="true" />
        <svg data-depth="" className={styles.fore} viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,120 L0,70 Q40,40 70,66 L82,30 L90,64 Q130,50 160,72 L176,44 L182,74 Q260,60 320,84 L1200,96 L1200,120 Z M960,120 L980,58 L992,92 L1004,40 L1016,94 Q1080,70 1140,80 L1152,50 L1160,86 Q1185,74 1200,78 L1200,120 Z" />
        </svg>
      </div>
    </Shot>
  );
}
