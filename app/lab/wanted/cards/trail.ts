/**
 * The trail's geometry, and the timing of a traveller walking it.
 *
 * The trail is one smooth curve (Catmull-Rom, as cubic Béziers) through the
 * checkpoints, with a lead-in from off the left and a lead-out to the right.
 * Everything that moves along it needs to know where each checkpoint falls
 * as a fraction of the curve's length (the drawing reveals a checkpoint when
 * it reaches that fraction; the traveller stops there), so the curve is
 * measured here, once, on the server, by walking each segment in small steps.
 *
 * All output is rounded: it is rendered on the server and hydrated on the
 * client, and the fifteenth decimal differs between them.
 */

type Pt = { x: number; y: number };

const r2 = (n: number) => Math.round(n * 100) / 100;
const r4 = (n: number) => Math.round(n * 10000) / 10000;

function cubic(a: Pt, b: Pt, c: Pt, d: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

export type TrailGeometry = {
  /** The path, in the 1200 x 440 units of the trail's viewBox. */
  d: string;
  /** Where each checkpoint falls along the path, 0 to 1. */
  at: number[];
  /** The path's length, in viewBox units. */
  length: number;
};

export function trailGeometry(nodes: Pt[], lead: Pt = { x: -20, y: 330 }, tail: Pt = { x: 1220, y: 120 }): TrailGeometry {
  const pts = [lead, ...nodes, tail];
  let d = `M${pts[0].x},${pts[0].y}`;
  const reach = [0];
  let length = 0;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: r2(p1.x + (p2.x - p0.x) / 6), y: r2(p1.y + (p2.y - p0.y) / 6) };
    const c2 = { x: r2(p2.x - (p3.x - p1.x) / 6), y: r2(p2.y - (p3.y - p1.y) / 6) };
    d += ` C${c1.x},${c1.y} ${c2.x},${c2.y} ${p2.x},${p2.y}`;
    let prev = p1;
    for (let s = 1; s <= 48; s += 1) {
      const q = cubic(p1, c1, c2, p2, s / 48);
      length += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    reach.push(length);
  }
  /* reach[k] is the length up to pts[k]; checkpoint i is pts[i + 1]. */
  return { d, at: nodes.map((_, i) => r4(reach[i + 1] / length)), length: r2(length) };
}

export type Walk = {
  dur: string;
  keyPoints: string;
  keyTimes: string;
  keySplines: string;
  /** When the traveller reaches each checkpoint, 0 to 1 of the loop. */
  arrive: number[];
};

/**
 * A walk from the first checkpoint to the last: a pause at each, then on to
 * the next at a steady pace (eased in and out of every stop), the time on
 * each stretch in proportion to its length. Written as the keyPoints and
 * keyTimes of an SVG animateMotion, which measure along the path by length,
 * the same way `at` does.
 */
export function walk(geometry: TrailGeometry, { pause = 1.1, speed = 240 } = {}): Walk {
  const at = geometry.at;
  const points: number[] = [];
  const times: number[] = [];
  const splines: string[] = [];
  const arrive: number[] = [];
  let t = 0;
  for (let k = 0; k < at.length; k += 1) {
    if (k > 0) {
      t += ((at[k] - at[k - 1]) * geometry.length) / speed;
      splines.push("0.45 0 0.55 1");
    }
    arrive.push(t);
    points.push(at[k]);
    times.push(t);
    t += pause;
    points.push(at[k]);
    times.push(t);
    splines.push("0 0 1 1");
  }
  return {
    dur: `${r2(t)}s`,
    keyPoints: points.map(r4).join(";"),
    keyTimes: times.map((x) => r4(x / t)).join(";"),
    keySplines: splines.join(";"),
    arrive: arrive.map((x) => r4(x / t)),
  };
}
