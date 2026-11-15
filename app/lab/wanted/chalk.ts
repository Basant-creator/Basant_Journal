/**
 * The chalk board's hand (Reveal.tsx): the strokes, and the loop that lays
 * them down frame by frame. No DOM here, only a 2D context, so the same
 * code runs in a worker on an OffscreenCanvas (chalk.worker.ts), off the
 * main thread entirely, or, where a browser cannot hand a canvas to a
 * worker, on the main thread as before.
 */

export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/* How the hand moves: widths are fractions of the picture's height. */
export const SKETCH_W = 0.16;
export const ERASE_W = 0.22;

/* A struggling board: most of its frames over this, across at least this
   many of them, and the machine is taken to be weak (quality.ts). */
const SLOW_FRAME_MS = 50;
const SLOW_SAMPLE = 24;
const SLOW_SHARE = 0.5;

type Pt = { x: number; y: number };

/**
 * An image laid over a w by h board the way object-fit: cover lays it,
 * at the picture's own object-position (fx, fy as fractions). `iw` and
 * `ih` are the file's real pixels.
 */
export function fitPattern(
  ctx: Ctx2D,
  image: CanvasImageSource,
  iw: number,
  ih: number,
  w: number,
  h: number,
  fx: number,
  fy: number,
): CanvasPattern | null {
  const s = Math.max(w / iw, h / ih);
  const pattern = ctx.createPattern(image, "no-repeat");
  pattern?.setTransform(new DOMMatrix().translate((w - iw * s) * fx, (h - ih * s) * fy).scale(s));
  return pattern;
}

export type BoardHooks = {
  raf: (cb: (now: number) => void) => number;
  cancel: (id: number) => void;
  /* The cloth waits while this is true. */
  holding: () => boolean;
  /* The colour to rub back to, once there is one. */
  colour: () => CanvasPattern | null;
  /* The picture could not be had: stop, there is nothing to rub back to. */
  failed: () => boolean;
  onDrawn: () => void;
  onDone: () => void;
  onSlow: () => void;
};

/**
 * Chalk the drawing in, then, once the chalk is most of the way down, the
 * colour is there and nothing is holding it, rub it back to colour; the
 * cloth's last pass leaves no gaps. Returns a stop function.
 */
export function runBoard(
  ctx: Ctx2D,
  sketch: CanvasPattern,
  w: number,
  h: number,
  grain: number,
  sketchMs: number,
  eraseMs: number,
  hooks: BoardHooks,
): () => void {
  const sketchPath = scribble(w, h, h * SKETCH_W, 0.12, 1);
  const erasePath = scribble(w, h, h * ERASE_W, -0.08, 2);
  let t0 = 0;
  let eraseFrom = 0;
  let sketched = 0;
  let erased = 0;
  let drawn = false;
  let last = 0;
  let frames = 0;
  let slow = 0;
  let stopped = false;
  let frame = 0;

  const tick = (now: number) => {
    if (stopped) return;
    if (!t0) t0 = now;
    const t = now - t0;
    /* How the board is keeping up, measured once, over its first frames. */
    if (last && frames < SLOW_SAMPLE) {
      frames += 1;
      if (now - last > SLOW_FRAME_MS) slow += 1;
      if (frames === SLOW_SAMPLE && slow / frames > SLOW_SHARE) hooks.onSlow();
    }
    last = now;
    const colour = hooks.colour();
    if (hooks.failed() || (t > sketchMs + 9000 && !hooks.holding())) {
      stopped = true;
      hooks.onDone();
      return;
    }

    sketched = stroke(ctx, sketch, sketchPath, sketched, ease(Math.min(1, t / sketchMs)), h * SKETCH_W, grain);
    if (!drawn && t >= sketchMs) {
      drawn = true;
      hooks.onDrawn();
    }
    if (colour && !eraseFrom && !hooks.holding() && t >= sketchMs * 0.72) eraseFrom = now;
    const pe = eraseFrom ? Math.min(1, (now - eraseFrom) / eraseMs) : 0;
    if (colour && pe > 0) erased = stroke(ctx, colour, erasePath, erased, ease(pe), h * ERASE_W, grain);

    if (!colour || pe < 1) {
      frame = hooks.raf(tick);
    } else {
      ctx.globalAlpha = 1;
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, w, h);
      stopped = true;
      hooks.onDone();
    }
  };
  frame = hooks.raf(tick);
  return () => {
    stopped = true;
    hooks.cancel(frame);
  };
}

export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * One hand going back and forth across the board, row under row, each pass
 * on a slight slant (`tilt`, as a fraction of the width) and never quite
 * straight. Seeded, so every visit draws the same strokes.
 */
export function scribble(w: number, h: number, width: number, tilt: number, seed: number): Pt[] {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const rowGap = width * 0.62;
  const rows = Math.ceil((h + Math.abs(tilt) * w + width) / rowGap) + 1;
  const step = width * 0.35;
  const pts: Pt[] = [];
  for (let r = 0; r < rows; r += 1) {
    const forward = r % 2 === 0;
    const y0 = -width * 0.5 - Math.max(0, tilt) * w + r * rowGap;
    const n = Math.ceil((w + width * 2) / step);
    for (let i = 0; i <= n; i += 1) {
      const u = forward ? i / n : 1 - i / n;
      const x = -width + u * (w + width * 2);
      const wobble = Math.sin(u * Math.PI * (2 + rand())) * width * 0.12 + (rand() - 0.5) * width * 0.1;
      pts.push({ x, y: y0 + tilt * x + wobble });
    }
  }
  return pts;
}

/**
 * Lay down the path from where it got to (`from`, an index) up to fraction
 * `p` of its length, filled with `paint`. A solid core, laid as one path so
 * nothing beads where segments meet; a few bristle strands running beside
 * it; and loose grain scattered along both edges, thinning outward, which is
 * what makes it read as chalk or a dry cloth rather than a vector stroke.
 * `grain` is the size of one grain in canvas pixels.
 */
export function stroke(
  ctx: Ctx2D,
  paint: CanvasPattern,
  path: Pt[],
  from: number,
  p: number,
  width: number,
  grain: number,
): number {
  const to = Math.min(path.length - 1, Math.floor(p * (path.length - 1)));
  if (to <= from) return from;
  ctx.strokeStyle = paint;
  ctx.fillStyle = paint;
  ctx.lineJoin = "round";

  ctx.globalAlpha = 1;
  ctx.lineCap = "round";
  ctx.lineWidth = width * 0.7;
  ctx.beginPath();
  ctx.moveTo(path[from].x, path[from].y);
  for (let i = from + 1; i <= to; i += 1) ctx.lineTo(path[i].x, path[i].y);
  ctx.stroke();

  const normal = (i: number) => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
  };

  ctx.lineCap = "butt";
  for (const [offset, thick, alpha] of [
    [0.4, 0.035, 0.75],
    [-0.39, 0.03, 0.7],
    [0.47, 0.018, 0.45],
    [-0.46, 0.02, 0.5],
  ]) {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width * thick;
    ctx.beginPath();
    for (let i = from; i <= to; i += 1) {
      const n = normal(i);
      const x = path[i].x + n.x * width * offset;
      const y = path[i].y + n.y * width * offset;
      if (i === from) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  for (let i = from + 1; i <= to; i += 1) {
    const a = path[i - 1];
    const b = path[i];
    const n = normal(i);
    for (let k = 0; k < 90; k += 1) {
      const t = Math.random();
      const side = Math.random() < 0.5 ? 1 : -1;
      const d = width * (0.33 + Math.random() ** 1.7 * 0.27);
      const size = grain * (1 + Math.random() * 2.4);
      ctx.globalAlpha = 0.35 + Math.random() * 0.65;
      ctx.fillRect(a.x + (b.x - a.x) * t + n.x * d * side, a.y + (b.y - a.y) * t + n.y * d * side, size, size);
    }
  }
  return to;
}
