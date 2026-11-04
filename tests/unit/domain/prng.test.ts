import { describe, expect, it } from 'vitest'

import { mulberry32, normal } from '@/domain'

describe('mulberry32', () => {
  it('produces the expected first five values for seed 42', () => {
    const prng = mulberry32(42)
    const values = Array.from({ length: 5 }, () => prng())
    expect(values).toEqual([
      0.6011037519201636, 0.44829055899754167, 0.8524657934904099, 0.6697340414393693,
      0.17481389874592423,
    ])
  })

  it('is deterministic for the same seed and diverges for another', () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    const c = mulberry32(8)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(a()).not.toBe(c())
  })
})

describe('normal', () => {
  it('has approximately zero mean and unit variance over 10,000 samples', () => {
    const prng = mulberry32(123)
    let sum = 0
    let sumSq = 0
    const n = 10_000
    for (let i = 0; i < n; i += 1) {
      const value = normal(prng)
      sum += value
      sumSq += value * value
    }
    const mean = sum / n
    const variance = sumSq / n - mean * mean
    expect(Math.abs(mean)).toBeLessThan(0.05)
    expect(Math.abs(Math.sqrt(variance) - 1)).toBeLessThan(0.05)
  })
})
