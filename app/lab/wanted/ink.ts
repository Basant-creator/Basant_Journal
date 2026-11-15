import { createRng, seedFrom } from "@/lib/map/rng";

/**
 * Inked geometry for the poster: the cracks round a bullet hole.
 *
 * All of it is seeded, so the server and the browser draw the same picture,
 * and all of it is rounded to two places, because Node and the browser
 * disagree in the fifteenth decimal and React reads that as a hydration
 * mismatch (it has happened three times in this codebase).
 */

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Cracks out of a hole: jagged polylines from near the rim outward, plus the
 * ragged hole itself. In a square of `size`, centred.
 */
export function wound(label: string, size: number, hole: number, reach: number) {
  const rng = createRng(seedFrom(label));
  const c = size / 2;

  const rim: string[] = [];
  const rimSteps = 18;
  for (let i = 0; i < rimSteps; i += 1) {
    const angle = (i / rimSteps) * Math.PI * 2;
    const radius = hole * rng.range(0.78, 1.18);
    rim.push(`${r2(c + Math.cos(angle) * radius)},${r2(c + Math.sin(angle) * radius)}`);
  }

  const flap: string[] = [];
  for (let i = 0; i < rimSteps; i += 1) {
    const angle = (i / rimSteps) * Math.PI * 2;
    const radius = hole * rng.range(1.35, 1.9);
    flap.push(`${r2(c + Math.cos(angle) * radius)},${r2(c + Math.sin(angle) * radius)}`);
  }

  /* Many short cracks and a few long ones. Nine long ones of a length read
     as legs, and a bullet hole with legs is a spider. */
  const cracks: string[] = [];
  const count = 15;
  for (let i = 0; i < count; i += 1) {
    let angle = (i / count) * Math.PI * 2 + rng.jitter(0.25);
    let radius = hole * 1.1;
    const length = reach * (i % 4 === 0 ? rng.range(0.7, 1) : rng.range(0.25, 0.5));
    const pts = [`${r2(c + Math.cos(angle) * radius)},${r2(c + Math.sin(angle) * radius)}`];
    while (radius < length) {
      radius += rng.range(reach * 0.08, reach * 0.18);
      angle += rng.jitter(0.16);
      pts.push(`${r2(c + Math.cos(angle) * radius)},${r2(c + Math.sin(angle) * radius)}`);
    }
    cracks.push(pts.join(" "));
  }

  return { rim: rim.join(" "), flap: flap.join(" "), cracks };
}
