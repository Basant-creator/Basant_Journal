/// <reference lib="webworker" />
/**
 * A chalk board drawn off the main thread (Reveal.tsx): the canvas is
 * handed over as an OffscreenCanvas, the drawing and the colour as
 * ImageBitmaps, and the hand runs here on the worker's own frames, so
 * however long it takes to chalk a plate in, the page's own thread is left
 * for scrolling and everything else on it.
 *
 * In:  start (canvas, drawing, size, fit, timing), colour (the picture),
 *      hold (the cloth may or may not go), finish (stop where it is),
 *      release (give the board's memory back and close).
 * Out: drawn (the chalk is all down), done (the colour is all back),
 *      slow (the board could not keep up: the machine is weak).
 */
import { fitPattern, runBoard, type Ctx2D } from "./chalk";

type Start = {
  type: "start";
  canvas: OffscreenCanvas;
  board: ImageBitmap;
  w: number;
  h: number;
  fx: number;
  fy: number;
  grain: number;
  sketchMs: number;
  eraseMs: number;
  hold: boolean;
};
type In =
  | Start
  | { type: "colour"; image: ImageBitmap }
  | { type: "hold"; hold: boolean }
  | { type: "finish" }
  | { type: "release" };

const scope = self as unknown as DedicatedWorkerGlobalScope;

/* A worker has its own animation frames where OffscreenCanvas does; where
   it has not, a timer at a 120 Hz screen's pace stands in for them. */
const raf =
  typeof scope.requestAnimationFrame === "function"
    ? (cb: (now: number) => void) => scope.requestAnimationFrame(cb)
    : (cb: (now: number) => void) => scope.setTimeout(() => cb(performance.now()), 1000 / 120);
const cancel =
  typeof scope.cancelAnimationFrame === "function" ? (id: number) => scope.cancelAnimationFrame(id) : (id: number) => scope.clearTimeout(id);

let canvas: OffscreenCanvas | null = null;
let ctx: Ctx2D | null = null;
let fit: Start | null = null;
let hold = false;
let colour: CanvasPattern | null = null;
let stop: (() => void) | null = null;

scope.onmessage = (event: MessageEvent<In>) => {
  const m = event.data;
  switch (m.type) {
    case "start": {
      fit = m;
      canvas = m.canvas;
      canvas.width = m.w;
      canvas.height = m.h;
      ctx = canvas.getContext("2d");
      hold = m.hold;
      const sketch = ctx ? fitPattern(ctx, m.board, m.board.width, m.board.height, m.w, m.h, m.fx, m.fy) : null;
      if (!ctx || !sketch) {
        scope.postMessage({ type: "done" });
        return;
      }
      stop = runBoard(ctx, sketch, m.w, m.h, m.grain, m.sketchMs, m.eraseMs, {
        raf,
        cancel,
        holding: () => hold,
        colour: () => colour,
        failed: () => false,
        onDrawn: () => scope.postMessage({ type: "drawn" }),
        onDone: () => scope.postMessage({ type: "done" }),
        onSlow: () => scope.postMessage({ type: "slow" }),
      });
      return;
    }
    case "colour":
      if (ctx && fit) colour = fitPattern(ctx, m.image, m.image.width, m.image.height, fit.w, fit.h, fit.fx, fit.fy);
      return;
    case "hold":
      hold = m.hold;
      return;
    case "finish":
      stop?.();
      return;
    case "release":
      stop?.();
      if (canvas) {
        canvas.width = 0;
        canvas.height = 0;
      }
      scope.close();
  }
};
