"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { chalkSrc } from "./art";
import { fitPattern, runBoard } from "./chalk";
import { qualityOf, struggled } from "./quality";
import styles from "./Reveal.module.css";

/* "drawn": the chalk is all down (the cloth may already be on its way, or,
   held, waiting). */
export type Stage = "waiting" | "drawing" | "drawn" | "done";

/* How long the hand takes, in milliseconds (the strokes are chalk.ts). */
const SKETCH_MS = 1100;
const ERASE_MS = 1700;

/* Where the canvas can be handed to a worker, the board is drawn there. */
const offThread = () =>
  typeof Worker !== "undefined" &&
  typeof OffscreenCanvas !== "undefined" &&
  typeof HTMLCanvasElement.prototype.transferControlToOffscreen === "function" &&
  typeof createImageBitmap === "function";

type Board = { hold: (on: boolean) => void; finish: () => void; release: () => void };

/**
 * A picture that arrives the way it would be made on a board: first chalked
 * in, white line on black (the picture's own line drawing, made offline by
 * scripts/chalk-lines.py), then rubbed back with a rough cloth to the colour
 * underneath.
 *
 * Both passes are one hand going back and forth across the board, each
 * stroke a little ragged at its edge, drawn a few segments a frame onto a
 * canvas that sits exactly over the picture. When the cloth has been over
 * all of it the canvas fades and leaves the ordinary <Image>, so what stays
 * on the page is the optimised picture, not a drawing of it.
 *
 * It plays once, the first time the picture is on screen (`when="view"`), or
 * straight away (`when="load"`). Without script, with reduced motion, on a
 * machine the site has judged too weak, or on a low grade (quality.ts), the
 * picture is simply there: blurred from its own few bytes of placeholder
 * until the file arrives, then sharp. If the file never arrives the frame
 * stays the plain dark it is drawn on, rather than a broken picture.
 *
 * The drawing is fetched at the size the board will be, through the image
 * optimiser (chalkSrc), and only when the picture is getting close.
 *
 * The hand itself runs in a worker on an OffscreenCanvas (chalk.worker.ts)
 * wherever the browser can do that: a plate takes about three seconds to
 * chalk in and rub back, and on the main thread that was most of every
 * frame's budget at 120 Hz, exactly while the page was being scrolled into
 * the next chapter. Where it cannot, the same code runs here as before.
 */
export function Reveal({
  src,
  lines,
  alt,
  sizes,
  className,
  style,
  priority = false,
  when = "view",
  delay = 0,
  sketchMs = SKETCH_MS,
  eraseMs = ERASE_MS,
  hold = false,
  seen = 0.25,
  finish = false,
  onStage,
}: {
  src: StaticImageData;
  lines: StaticImageData;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  when?: "view" | "load";
  delay?: number;
  /* How long the chalk and the rubbing-back take; the loader stretches them. */
  sketchMs?: number;
  eraseMs?: number;
  /* While true the chalk is finished but the cloth waits (a loader holds
     the drawing until what it is waiting for has arrived). */
  hold?: boolean;
  /* How much of it must be on screen before the hand starts. Visibility
     counts clipping, so a picture seen through a small window (a pinned
     plate) asks for less. */
  seen?: number;
  /* Done now: the picture is shown as it is and the hand stops where it
     is (the opening's Skip intro). */
  finish?: boolean;
  onStage?: (stage: Stage) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const [stage, setStage] = useState<Stage>("waiting");
  const [failed, setFailed] = useState(false);
  /* The decision, kept off state so StrictMode's second effect pass reads
     what the first one did rather than bailing on its own flag. */
  const started = useRef(false);
  const holding = useRef(hold);
  holding.current = hold;
  const finished = useRef(finish);
  finished.current = finish;
  /* The board being drawn, wherever it is being drawn, and whether the
     canvas has been handed over (that can happen only once). */
  const board = useRef<Board | null>(null);
  const handed = useRef(false);
  useEffect(() => {
    board.current?.hold(hold);
  }, [hold]);
  useEffect(() => {
    if (!finish) return;
    board.current?.finish();
    setStage("done");
  }, [finish]);
  const report = useRef(onStage);
  report.current = onStage;
  useEffect(() => {
    report.current?.(stage);
  }, [stage]);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const img = photo.current;
    if (!el || !cv || !img) return;

    const still =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "still" ||
      qualityOf(el) === "low";
    if (still) {
      setStage("done");
      return;
    }

    let cancelled = false;
    let timer = 0;

    const loaded = (image: HTMLImageElement) =>
      image.complete && image.naturalWidth
        ? Promise.resolve()
        : new Promise<void>((resolve, reject) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => reject(new Error("image failed")), { once: true });
          });

    /* The drawing is fetched when the picture is getting close, so the hand
       can start the moment it arrives; the photograph itself loads as the
       <Image> always would. */
    let chalk: HTMLImageElement | null = null;
    const fetchChalk = () => {
      if (chalk) return chalk;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      chalk = new window.Image();
      chalk.decoding = "async";
      chalk.src = chalkSrc(lines, el.offsetWidth * dpr, el.offsetHeight * dpr, window.innerWidth * (window.devicePixelRatio || 1));
      return chalk;
    };

    const play = async () => {
      if (started.current) return;
      started.current = true;
      const chalkImage = fetchChalk();
      try {
        await loaded(chalkImage);
        /* Decoded off the main thread now, not in the middle of the first
           frame that paints with it. */
        await chalkImage.decode().catch(() => undefined);
      } catch {
        if (!cancelled) setStage("done");
        return;
      }
      if (cancelled || finished.current) return;
      await new Promise((r) => (timer = window.setTimeout(r, delay)));
      if (cancelled || finished.current) return;
      setStage("drawing");
      void draw(chalkImage);
    };

    /* The picture, as a plain copy of whichever file the <Image> chose
       (from cache, so no second download), decoded off the main thread.
       The <img> reports its size divided by the srcset density, but a
       pattern paints the file's real pixels, so a copy is what is fitted. */
    let pictureFailed = false;
    img.addEventListener("error", () => (pictureFailed = true), { once: true });
    const picture = () =>
      loaded(img).then(() => {
        const fresh = new window.Image();
        fresh.src = img.currentSrc || img.src;
        return fresh.decode().then(() => fresh);
      });

    /* The board, sized to the box at the screen's density (capped: a chalk
       line does not need a retina's worth of pixels). Layout size, not the
       painted one: a zoom or a drift on an ancestor scales the board along
       with the picture, so it is drawn at the picture's own size. The
       drawing is laid over it at the picture's own object-position. */
    const draw = async (drawing: HTMLImageElement) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.round(el.offsetWidth * dpr));
      const h = Math.max(1, Math.round(el.offsetHeight * dpr));
      const pos = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100);
      const fx = Number.isFinite(pos[0]) ? pos[0] : 0.5;
      const fy = Number.isFinite(pos[1]) ? pos[1] : 0.5;
      const report = {
        drawn: () => {
          if (!cancelled) setStage((now) => (now === "done" ? now : "drawn"));
        },
        done: () => {
          if (!cancelled) setStage("done");
        },
        slow: () => struggled(el),
      };

      if (offThread() && !handed.current) {
        let worker: Worker;
        try {
          const bitmap = await createImageBitmap(drawing);
          if (cancelled || finished.current) return;
          const off = cv.transferControlToOffscreen();
          handed.current = true;
          worker = new Worker(new URL("./chalk.worker.ts", import.meta.url));
          worker.postMessage(
            { type: "start", canvas: off, board: bitmap, w, h, fx, fy, grain: dpr, sketchMs, eraseMs, hold: holding.current },
            [off, bitmap],
          );
        } catch {
          report.done();
          return;
        }
        worker.onmessage = (event: MessageEvent<{ type: "drawn" | "done" | "slow" }>) => report[event.data.type]();
        worker.onerror = () => report.done();
        board.current = {
          hold: (on) => worker.postMessage({ type: "hold", hold: on }),
          finish: () => worker.postMessage({ type: "finish" }),
          release: () => worker.postMessage({ type: "release" }),
        };
        picture()
          .then((fresh) => createImageBitmap(fresh))
          .then(
            (image) => worker.postMessage({ type: "colour", image }, [image]),
            () => {
              worker.postMessage({ type: "finish" });
              report.done();
            },
          );
        return;
      }
      if (handed.current) {
        report.done();
        return;
      }

      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      const sketch = ctx ? fitPattern(ctx, drawing, drawing.naturalWidth, drawing.naturalHeight, w, h, fx, fy) : null;
      if (!ctx || !sketch) {
        report.done();
        return;
      }
      let colour: CanvasPattern | null = null;
      picture().then(
        (fresh) => {
          if (!cancelled) colour = fitPattern(ctx, fresh, fresh.naturalWidth, fresh.naturalHeight, w, h, fx, fy);
        },
        () => (pictureFailed = true),
      );
      const stop = runBoard(ctx, sketch, w, h, dpr, sketchMs, eraseMs, {
        raf: (cb) => requestAnimationFrame(cb),
        cancel: (id) => cancelAnimationFrame(id),
        holding: () => holding.current,
        colour: () => colour,
        failed: () => pictureFailed,
        onDrawn: report.drawn,
        onDone: report.done,
        onSlow: report.slow,
      });
      board.current = {
        hold: () => undefined,
        finish: stop,
        release: () => {
          cv.width = 0;
          cv.height = 0;
        },
      };
    };

    let near: IntersectionObserver | null = null;
    let io: IntersectionObserver | null = null;
    if (when === "load") {
      void play();
    } else {
      const root = el.closest("[data-world]");
      near = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            near?.disconnect();
            fetchChalk();
          }
        },
        { root, rootMargin: "150% 0px" },
      );
      near.observe(el);
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            io?.disconnect();
            void play();
          }
        },
        { root, threshold: seen },
      );
      io.observe(el);
    }

    return () => {
      cancelled = true;
      started.current = false;
      near?.disconnect();
      io?.disconnect();
      window.clearTimeout(timer);
      board.current?.finish();
    };
  }, [lines.src, when, delay, sketchMs, eraseMs, seen]);

  /* Once it has faded, the board is let go (and its worker closed). */
  useEffect(() => {
    if (stage !== "done") return;
    const t = window.setTimeout(() => board.current?.release(), 900);
    return () => window.clearTimeout(t);
  }, [stage]);

  return (
    <div ref={root} className={styles.reveal} data-stage={stage} data-failed={failed ? "" : undefined}>
      <Image
        ref={photo}
        src={src}
        alt={alt}
        fill
        priority={priority}
        fetchPriority={priority ? "high" : undefined}
        sizes={sizes}
        placeholder="blur"
        onError={() => setFailed(true)}
        className={`${styles.picture} ${className ?? ""}`}
        style={style}
      />
      <canvas ref={canvas} className={`${styles.board} ${className ?? ""}`} aria-hidden="true" />
    </div>
  );
}
