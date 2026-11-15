"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createRng, seedFrom } from "@/lib/map/rng";
import { OPENING } from "./art";
import { qualityOf } from "./quality";
import { Reveal } from "./Reveal";
import { BoilFilters, boil, TallyMarks, useArrivals } from "./Tally";
import styles from "./Opening.module.css";

const r2 = (n: number) => Math.round(n * 100) / 100;

/* From the camera's release to the name being set and the cue showing:
   the bars (--open-t-bars) and the words (--open-t-reveal) and their
   staggered arrivals, in Opening.module.css. */
const INTRO_AFTER_GO_MS = 4600;

/* Dust caught in the backlight: seeded, so the server and the browser scatter
   it the same way, and rounded, or the fifteenth decimal differs between them
   and React calls it a hydration mismatch. Heavier toward the hooves and the
   herd, where the photograph's own dust is. */
const MOTES = (() => {
  const rng = createRng(seedFrom("wanted-dust"));
  return Array.from({ length: 26 }, () => ({
    x: r2(rng.range(8, 98)),
    y: r2(rng.range(34, 92)),
    size: r2(rng.range(2, 6.5)),
    dx: r2(rng.range(-14, -4)),
    dy: r2(rng.range(-9, -2)),
    o: r2(rng.range(0.35, 0.9)),
    dur: r2(rng.range(9, 19)),
    delay: r2(rng.range(-19, 0)),
  }));
})();

/**
 * The opening: a rider crossing a dust field into a low sun, in letterbox.
 *
 * It is also the page's loading screen. The camera starts close on the
 * horse, the photograph chalked onto the black and held there, the lines
 * alive, while a tally is kept in the corner: one mark for each thing that
 * has really arrived (useArrivals). When the last is in, the camera pulls
 * back to the whole frame and the chalk is rubbed back to colour (Reveal);
 * then the bars open and the name arrives. Everything timed in the opening
 * waits for that moment, not for the page load. A return to the page in the
 * same visit does not load again and does not pretend to.
 *
 * The photograph is still; what moves is everything a camera would add.
 * Once it is in colour the air keeps moving: banks of dust drift across,
 * motes float up through the light, the sun breathes on the lens. The pointer
 * moves the layers at different depths, and scrolling away sinks the picture
 * and lets the dark close over it.
 *
 * Only transform and opacity ever animate (the held chalk's boil apart,
 * stepped three times a second and only while it is held), the loops stop
 * whenever the opening is off screen, and reduced motion (or a machine the
 * site has judged too weak) gets the finished frame with nothing moving.
 */
export function Opening({ title, children }: { title: ReactNode; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  /* The drawing is in once the hand has it (or has given up on it). */
  const [sketched, setSketched] = useState(false);
  const { count, total, ready } = useArrivals(root, { once: true, drawing: sketched });
  /* The camera goes when the tally is in and the chalk is all down, and not
     the instant the second of them happens: the drawing is held a moment. */
  const [drawn, setDrawn] = useState(false);
  const [go, setGo] = useState(ready);
  useEffect(() => {
    if (go || !ready || !drawn) return;
    const timer = window.setTimeout(() => setGo(true), 500);
    return () => window.clearTimeout(timer);
  }, [go, ready, drawn]);

  /* The intro is everything up to the name being set: Skip intro is offered
     until then, and skipping finishes all of it at once, the chalk, the
     camera, the bars and the words, and puts the reader on the name. */
  const [skipped, setSkipped] = useState(false);
  const [settled, setSettled] = useState(ready);
  useEffect(() => {
    if (!go || settled) return;
    const timer = window.setTimeout(() => setSettled(true), INTRO_AFTER_GO_MS);
    return () => window.clearTimeout(timer);
  }, [go, settled]);
  const skip = () => {
    setSkipped(true);
    setGo(true);
    setSettled(true);
    window.requestAnimationFrame(() => root.current?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true }));
  };

  /* Arriving by an address that names a chapter (a shared link to #work,
     say), the reader is put there, not in front of an intro playing out of
     sight with the bar held back: the intro is simply finished, and focus
     is left where the address put it. */
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id && id !== "top" ? document.getElementById(id) : null;
    if (!target) return;
    setSkipped(true);
    setGo(true);
    setSettled(true);
    /* The browser lands on the chapter before the type has arrived; when it
       does, the text above reflows and the chapter drifts. Once the type is
       in, it is set back where the address put it, unless the reader has
       already moved off it. */
    const world = target.closest<HTMLElement>("[data-world]");
    if (!world) return;
    let moved = false;
    const stop = () => (moved = true);
    world.addEventListener("wheel", stop, { once: true, passive: true });
    world.addEventListener("touchstart", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });
    document.fonts.ready.then(() => {
      if (!moved) target.scrollIntoView({ block: "start", behavior: "instant" });
    });
    return () => {
      world.removeEventListener("wheel", stop);
      world.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);

  /* Pointer depth, eased toward the pointer with frame-rate independent
     damping, and only while there is distance left to cover; written only
     when the value changes at three places, and onto the three depth
     layers only, not inherited, so neither the tail of the ease nor the
     motes inside a layer are restyled (see cards/useDepth.ts). */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layers = [...el.querySelectorAll<HTMLElement>("[data-depth]")];

    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let last = 0;
    let wx = "";
    let wy = "";

    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 1 / 60;
      last = now;
      const k = 1 - Math.exp(-5 * dt);
      x += (tx - x) * k;
      y += (ty - y) * k;
      const nx = x.toFixed(3);
      const ny = y.toFixed(3);
      if (nx !== wx) for (const layer of layers) layer.style.setProperty("--px", nx);
      if (ny !== wy) for (const layer of layers) layer.style.setProperty("--py", ny);
      wx = nx;
      wy = ny;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.002) {
        frame = requestAnimationFrame(step);
      } else {
        frame = 0;
        last = 0;
      }
    };

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      tx = event.clientX / window.innerWidth - 0.5;
      ty = event.clientY / window.innerHeight - 0.5;
      if (!frame) frame = requestAnimationFrame(step);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, []);

  /* The motes, set drifting once the camera has gone (not while the page is
     still loading behind the chalk), through the Web Animations API with
     each mote's own numbers. As one CSS animation reading each mote's
     distance and brightness from custom properties they could not be
     handed to the compositor, and twenty-six of them were ticked on the
     main thread every frame for as long as the opening was on screen. */
  const drifting = useRef<Animation[]>([]);
  useEffect(() => {
    const el = root.current;
    if (!el || !go) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "still" ||
      qualityOf(el) === "low"
    )
      return;
    const paused = el.hasAttribute("data-paused");
    const animations = [...el.querySelectorAll<HTMLElement>("[data-mote]")].map((mote, i) => {
      const m = MOTES[i];
      const a = mote.animate(
        [
          { transform: "translate3d(0, 0, 0)", opacity: 0 },
          { opacity: m.o, offset: 0.18 },
          { opacity: m.o, offset: 0.78 },
          { transform: `translate3d(${m.dx}vw, ${m.dy}vh, 0)`, opacity: 0 },
        ],
        { duration: m.dur * 1000, delay: m.delay * 1000, iterations: Infinity, easing: "linear" },
      );
      if (paused) a.pause();
      return a;
    });
    drifting.current = animations;
    return () => {
      animations.forEach((a) => a.cancel());
      drifting.current = [];
    };
  }, [go]);

  /* Nothing loops while nobody can see it. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      el.toggleAttribute("data-paused", !entry.isIntersecting);
      for (const a of drifting.current) {
        if (entry.isIntersecting) a.play();
        else a.pause();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      className={styles.opening}
      aria-label="Opening"
      data-ready={go ? "" : undefined}
      data-loading={go ? undefined : ""}
      data-skipped={skipped ? "" : undefined}
    >
      <BoilFilters />
      <div className={styles.sink}>
        <div data-depth="" className={`${styles.depth} ${styles.depthFar}`}>
          <div className={styles.push}>
            <div className={styles.camera}>
              <div className={boil} data-held={go ? undefined : ""}>
                <Reveal
                  src={OPENING.src}
                  lines={OPENING.lines}
                  alt="A rider on horseback crossing a dust field at sunset, loose horses running behind him, all in silhouette against a low sun"
                  sizes="100vw"
                  priority
                  when="load"
                  delay={150}
                  sketchMs={1500}
                  eraseMs={1600}
                  hold={!go}
                  finish={skipped}
                  onStage={(stage) => {
                    if (stage !== "waiting") setSketched(true);
                    if (stage !== "waiting" && stage !== "drawing") setDrawn(true);
                  }}
                  className={styles.photo}
                />
              </div>
            </div>
          </div>
        </div>

        <span className={styles.flare} data-loop="" aria-hidden="true" />

        <div data-depth="" className={`${styles.depth} ${styles.depthMid}`} aria-hidden="true">
          <span className={`${styles.bank} ${styles.bankA}`} data-loop="" />
          <span className={`${styles.bank} ${styles.bankB}`} data-loop="" />
          <span className={`${styles.bank} ${styles.bankC}`} data-loop="" />
        </div>

        <div data-depth="" className={`${styles.depth} ${styles.depthNear}`} aria-hidden="true">
          {MOTES.map((m, i) => (
            <span
              key={i}
              className={styles.mote}
              data-mote=""
              style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.size}px`, height: `${m.size}px` }}
            />
          ))}
        </div>
      </div>

      <span className={styles.scrim} aria-hidden="true" />
      <span className={styles.grain} aria-hidden="true" />
      <span className={styles.lift} aria-hidden="true" />
      <span className={`${styles.bar} ${styles.barTop}`} aria-hidden="true" />
      <span className={`${styles.bar} ${styles.barBottom}`} aria-hidden="true" />

      <div className={styles.tally} role="status">
        <span className={styles.tallyLabel}>{ready ? "Loaded" : "Loading"}</span>
        <TallyMarks count={count} total={total} className={styles.tallyMarks} />
      </div>

      <div className={styles.copyLayer}>
        {/* The name stands in the dust: a bank of it drifts across its foot. */}
        <div className={styles.nameSlot}>
          {title}
          <span className={styles.nameDust} data-loop="" aria-hidden="true" />
        </div>
        {children}
      </div>

      {settled ? null : (
        <button type="button" className={styles.skip} onClick={skip}>
          Skip intro
        </button>
      )}

      <span className={styles.cue} aria-hidden="true">
        <span className={styles.cueLine} data-loop="" />
      </span>
    </section>
  );
}
