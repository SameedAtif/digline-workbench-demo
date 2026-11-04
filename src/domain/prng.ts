/**
 * mulberry32 — a tiny, fast, seeded 32-bit PRNG. Deterministic across runs.
 * Reference: Tommy Ettinger's survey of small PRNGs.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Standard normal sample via the Box-Muller transform. */
export function normal(prng: () => number): number {
  let u = 0
  let v = 0
  while (u === 0) u = prng()
  while (v === 0) v = prng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Uniform sample in [min, max). */
export function uniform(prng: () => number, min: number, max: number): number {
  return min + (max - min) * prng()
}
