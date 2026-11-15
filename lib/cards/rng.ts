/**
 * Deterministic pseudo-random numbers, for drawings that must come out the
 * same on the server and in the browser (the tumbleweed's scribble). A
 * seeded stream rather than Math.random(), and every coordinate drawn from
 * it rounded to two decimals, or the two disagree in the fifteenth place and
 * React reports a hydration mismatch.
 */
export interface Rng {
  /** Next value in [0, 1). */
  next(): number;
  /** Next value in [min, max). */
  range(min: number, max: number): number;
}

/** mulberry32: small, fast, good enough for visual noise. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { next, range: (min, max) => min + next() * (max - min) };
}

/** A stable numeric seed from a name, so seeds can be named. */
export function seedFrom(label: string): number {
  let hash = 2166136261;
  for (let i = 0; i < label.length; i += 1) {
    hash ^= label.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
