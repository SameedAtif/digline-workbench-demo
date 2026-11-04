import { describe, expect, it } from 'vitest'

import { FreeFaceField, mulberry32, PerturbedField, UniformField } from '@/domain'

describe('UniformField', () => {
  it('returns the same displacement everywhere', () => {
    const field = new UniformField({ dx: 1, dz: 0 })
    expect(field.sample(0, 0, 0)).toEqual([1, 0, 0])
    expect(field.sample(500, -12, 99)).toEqual([1, 0, 0])
  })
})

describe('FreeFaceField', () => {
  const field = new FreeFaceField({
    facePoint: [0, 0, 0],
    faceNormal: [0, 0, 1],
    maxThrow: 10,
    decay: 0.1,
  })

  it('is at most maxThrow at the face', () => {
    const [, , dz] = field.sample(0, 0, 0)
    expect(dz).toBeLessThanOrEqual(10)
    expect(dz).toBeCloseTo(10, 6)
  })

  it('decreases monotonically with distance along the normal', () => {
    let previous = Infinity
    for (let distance = 0; distance <= 100; distance += 5) {
      const [, , dz] = field.sample(0, 0, distance)
      expect(dz).toBeLessThan(previous)
      previous = dz
    }
  })
})

describe('PerturbedField', () => {
  const base = new UniformField({ dx: 2, dy: 1, dz: 3 })

  it('is identical to the base when sigma is zero', () => {
    const field = new PerturbedField({ base, prng: mulberry32(1), sigma: 0 })
    expect(field.sample(1, 2, 3)).toEqual(base.sample(1, 2, 3))
  })

  it('is deterministic for the same seed', () => {
    const a = new PerturbedField({ base, prng: mulberry32(9), sigma: 2 })
    const b = new PerturbedField({ base, prng: mulberry32(9), sigma: 2 })
    expect([a.sample(0, 0, 0), a.sample(1, 1, 1)]).toEqual([b.sample(0, 0, 0), b.sample(1, 1, 1)])
  })
})
