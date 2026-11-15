"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { OPENING } from "../art";
import { Reveal, type Stage } from "../Reveal";
import { boil, TallyMarks, useArrivals } from "../Tally";
import styles from "./loading.module.css";

type Variant = "pullback" | "iris" | "tally";

/* Where the horse is in the opening's frame: the camera starts on him. */
const HORSE = "62% 56%";

function Title({ name, role, show }: { name: string; role: string; show: boolean }) {
  return (
    <div className={styles.title} data-show={show ? "" : undefined}>
      <p className={styles.name}>{name}</p>
      <p className={styles.role}>{role}</p>
    </div>
  );
}

/* --- A: the camera pulls back while the chalk is laid down ------------------------- */

function Pullback({ name, role }: { name: string; role: string }) {
  const [stage, setStage] = useState<Stage>("waiting");
  return (
    <div className={styles.frame} data-variant="pullback">
      <div className={styles.zoom} style={{ transformOrigin: HORSE } as CSSProperties}>
        <Reveal
          src={OPENING.src}
          lines={OPENING.lines}
          alt="A rider on horseback crossing a dust field at sunset"
          sizes="(max-width: 900px) 100vw, 1200px"
          priority
          when="load"
          delay={250}
          sketchMs={2200}
          eraseMs={1700}
          className={styles.photo}
          onStage={setStage}
        />
      </div>
      <span className={styles.grain} aria-hidden="true" />
      <Title name={name} role={role} show={stage === "done"} />
    </div>
  );
}

/* --- B: an iris opening on him, as an old picture opened ---------------------------- */

function Iris({ name, role }: { name: string; role: string }) {
  const [stage, setStage] = useState<Stage>("waiting");
  return (
    <div className={styles.frame} data-variant="iris">
      <div className={styles.iris} style={{ "--at": HORSE } as CSSProperties}>
        <div className={styles.zoom} style={{ transformOrigin: HORSE } as CSSProperties}>
          <Reveal
            src={OPENING.src}
            lines={OPENING.lines}
            alt="A rider on horseback crossing a dust field at sunset"
            sizes="(max-width: 900px) 100vw, 1200px"
            priority
            when="load"
            delay={150}
            sketchMs={1700}
            eraseMs={1500}
            className={styles.photo}
            onStage={setStage}
          />
        </div>
      </div>
      <span className={styles.flicker} aria-hidden="true" />
      <span className={styles.grain} aria-hidden="true" />
      <Title name={name} role={role} show={stage === "done"} />
    </div>
  );
}

/* --- C: held on the drawing, a tally kept of what has come in ------------------------ */

function Tally({ name, role }: { name: string; role: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<Stage>("waiting");
  const { count, total, ready } = useArrivals(frame, { drawing: stage !== "waiting" });

  return (
    <div ref={frame} className={styles.frame} data-variant="tally" data-ready={ready ? "" : undefined}>
      <div className={styles.zoom} style={{ transformOrigin: HORSE } as CSSProperties}>
        <div className={boil} data-held={ready ? undefined : ""}>
          <Reveal
            src={OPENING.src}
            lines={OPENING.lines}
            alt="A rider on horseback crossing a dust field at sunset"
            sizes="(max-width: 900px) 100vw, 1200px"
            priority
            when="load"
            sketchMs={1500}
            eraseMs={1500}
            hold={!ready}
            className={styles.photo}
            onStage={setStage}
          />
        </div>
      </div>
      <div className={styles.counter} aria-live="polite">
        <span className={styles.counterLabel}>Loading</span>
        <TallyMarks count={count} total={total} className={styles.tally} />
      </div>
      <span className={styles.grain} aria-hidden="true" />
      <Title name={name} role={role} show={stage === "done"} />
    </div>
  );
}

/**
 * Three loaders for the opening, to choose between: each runs from a
 * close-up of the horse in chalk to the opening as the page shows it.
 * Replay restarts one from the beginning.
 */
export function Loader({ variant, name, role }: { variant: Variant; name: string; role: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  /* -1 until it is on screen: a loader nobody is watching does not run. */
  const [run, setRun] = useState(-1);
  const Body = variant === "pullback" ? Pullback : variant === "iris" ? Iris : Tally;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.6) {
          io.disconnect();
          setRun((r) => Math.max(r, 0));
        }
      },
      { root: el.closest("[data-world]"), threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrap} className={styles.wrap}>
      {run >= 0 ? <Body key={run} name={name} role={role} /> : <div className={styles.frame} />}
      <button type="button" className={styles.replay} onClick={() => setRun((r) => Math.max(r, 0) + 1)}>
        Play again
      </button>
    </div>
  );
}
