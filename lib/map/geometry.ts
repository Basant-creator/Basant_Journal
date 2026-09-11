/**
 * Path geometry for the survey map.
 *
 * Everything the map draws is built from these primitives rather than from
 * hand-written `d` strings, so the linework stays editable and the
 * hand-drawn irregularity is a parameter instead of a thousand magic numbers.
 */

import type { Rng } from "./rng";

export interface Point {
  x: number;
  y: number;
}

export const pt = (x: number, y: number): Point => ({ x, y });

const round = (n: number) => Math.round(n * 100) / 100;

/** Straight polyline through the points. */
export function polylinePath(points: Point[], closed = false): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  const body = rest.map((p) => `L ${round(p.x)} ${round(p.y)}`).join(" ");
  return `M ${round(first.x)} ${round(first.y)} ${body}${closed ? " Z" : ""}`;
}

/**
 * Catmull-Rom through the points, emitted as cubic beziers. This is what makes
 * rivers and contours read as drawn rather than plotted.
 */
export function smoothPath(points: Point[], closed = false): string {
  const n = points.length;
  if (n < 3) return polylinePath(points, closed);

  const at = (i: number): Point => {
    if (closed) return points[(i + n) % n];
    return points[Math.min(Math.max(i, 0), n - 1)];
  };

  const segments: string[] = [`M ${round(points[0].x)} ${round(points[0].y)}`];
  const last = closed ? n : n - 1;

  for (let i = 0; i < last; i += 1) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    segments.push(
      `C ${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`,
    );
  }

  return segments.join(" ") + (closed ? " Z" : "");
}

/** Displaces every point a little. The whole "imperfect ink" effect. */
export function jitterPoints(points: Point[], rng: Rng, amount: number): Point[] {
  return points.map((p) => pt(p.x + rng.jitter(amount), p.y + rng.jitter(amount)));
}

/** Evenly spaced samples along a straight line. */
export function sampleLine(a: Point, b: Point, steps: number): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    out.push(pt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
  }
  return out;
}

/** A closed wobbly ring — the basis of every contour on the map. */
export function ringPoints(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  steps: number,
  rng: Rng,
  wobble: number,
): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    const r = 1 + rng.jitter(wobble);
    out.push(pt(cx + Math.cos(angle) * rx * r, cy + Math.sin(angle) * ry * r));
  }
  return out;
}

/** Unit vector perpendicular to a -> b, used for hachures and river banks. */
export function normal(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return pt(-dy / len, dx / len);
}

/** Offsets a polyline sideways — river banks, road edges. */
export function offsetPolyline(points: Point[], distance: number): Point[] {
  return points.map((p, i) => {
    const a = points[Math.max(i - 1, 0)];
    const b = points[Math.min(i + 1, points.length - 1)];
    const nrm = normal(a, b);
    return pt(p.x + nrm.x * distance, p.y + nrm.y * distance);
  });
}

/** Quadratic curve between two points, bowed perpendicular by `bow`. */
export function arcPath(a: Point, b: Point, bow: number): string {
  const mid = pt((a.x + b.x) / 2, (a.y + b.y) / 2);
  const nrm = normal(a, b);
  const control = pt(mid.x + nrm.x * bow, mid.y + nrm.y * bow);
  return `M ${round(a.x)} ${round(a.y)} Q ${round(control.x)} ${round(control.y)} ${round(b.x)} ${round(b.y)}`;
}

export interface PointOnPath extends Point {
  /** Tangent heading in degrees, for orienting a mark along the path. */
  angle: number;
}

/**
 * A point on the same quadratic curve `arcPath` draws, with its heading.
 *
 * Used to lay survey arrows along a trail so they sit on the line and point
 * the way it runs — computed from the curve rather than eyeballed, so they
 * stay correct if the bow is retuned.
 */
export function pointOnArc(a: Point, b: Point, bow: number, t: number): PointOnPath {
  const mid = pt((a.x + b.x) / 2, (a.y + b.y) / 2);
  const nrm = normal(a, b);
  const c = pt(mid.x + nrm.x * bow, mid.y + nrm.y * bow);

  const u = 1 - t;
  const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
  const y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;

  const dx = 2 * u * (c.x - a.x) + 2 * t * (b.x - c.x);
  const dy = 2 * u * (c.y - a.y) + 2 * t * (b.y - c.y);

  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}
