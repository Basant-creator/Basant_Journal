/**
 * Deterministic pseudo-random numbers.
 *
 * The map's "imperfect ink" comes from jitter, and jitter has to be identical
 * on the server and the client or React reports a hydration mismatch. Every
 * generator therefore takes a seeded stream rather than Math.random().
 */

export interface Rng {
  /** Next value in [0, 1). */
  next(): number;
  /** Next value in [min, max). */
  range(min: number, max: number): number;
  /** Next value in [-amount, amount]. */
  jitter(amount: number): number;
  /** True with the given probability. */
  chance(probability: number): boolean;
}

/** mulberry32 — small, fast, good enough for visual noise. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    jitter: (amount) => (next() * 2 - 1) * amount,
    chance: (probability) => next() < probability,
  };
}

/** Turns a string into a stable numeric seed, so seeds can be named. */
export function seedFrom(label: string): number {
  let hash = 2166136261;
  for (let i = 0; i < label.length; i += 1) {
    hash ^= label.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
