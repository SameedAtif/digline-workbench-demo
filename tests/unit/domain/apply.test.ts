import { describe, expect, it } from 'vitest'

import { applyField, createBlockModel, createPolygon, deformPolygon, UniformField } from '@/domain'

const model = createBlockModel({
  x: new Float32Array([1, 2, 3]),
  y: new Float32Array([0, 0, 0]),
  z: new Float32Array([0, 0, 0]),
  size: new Float32Array([1, 1, 1]),
  grade: new Float32Array([1, 2, 3]),
  material: new Uint8Array([1, 1, 1]),
  tonnes: new Float32Array([2.7, 2.7, 2.7]),
})

describe('applyField', () => {
  it('translates every block by t times the field', () => {
    const moved = applyField(model, new UniformField({ dx: 1, dz: 0 }), 0.5)
    expect(Array.from(moved.x)).toEqual([1.5, 2.5, 3.5])
  })

  it('returns an equal model at t = 0 without touching the input', () => {
    const moved = applyField(model, new UniformField({ dx: 5, dz: 5 }), 0)
    expect(Array.from(moved.x)).toEqual(Array.from(model.x))
    expect(Array.from(model.x)).toEqual([1, 2, 3])
  })

  it('is reproducible for the same inputs', () => {
    const field = new UniformField({ dx: 3, dz: -2 })
    const a = applyField(model, field, 1)
    const b = applyField(model, field, 1)
    expect(Array.from(a.x)).toEqual(Array.from(b.x))
    expect(Array.from(a.z)).toEqual(Array.from(b.z))
  })
})

describe('deformPolygon', () => {
  const polygon = createPolygon(new Float32Array([0, 0, 0, 4, 4, 4, 4, 0]), 0, true)

  it('preserves vertex count and the closed flag', () => {
    const deformed = deformPolygon(polygon, new UniformField({ dx: 4, dz: 4 }), 1)
    expect(deformed.vertices.length).toBe(polygon.vertices.length)
    expect(deformed.closed).toBe(true)
  })

  it('preserves area under a uniform translation', () => {
    const deformed = deformPolygon(polygon, new UniformField({ dx: 4, dz: 4 }), 1)
    const shoelace = (v: Float32Array): number => {
      let sum = 0
      for (let i = 0; i < v.length; i += 2) {
        const j = (i + 2) % v.length
        sum += (v[i] ?? 0) * (v[j + 1] ?? 0) - (v[j] ?? 0) * (v[i + 1] ?? 0)
      }
      return Math.abs(sum) / 2
    }
    expect(shoelace(deformed.vertices)).toBeCloseTo(16, 5)
  })
})
