import { describe, expect, it } from 'vitest'

import { createPolygon, deformPolygon, UniformField } from '@/domain'
import { createEnsemble, ensembleOutlines } from '@/uncertainty'

const base = new UniformField({ dx: 5, dz: 5 })
const polygon = createPolygon(new Float32Array([0, 0, 0, 1, 1, 1, 1, 0]), 0, true)

describe('createEnsemble', () => {
  it('produces the requested number of fields', () => {
    expect(createEnsemble({ base, seed: 1, size: 10, sigma: 1 }).length).toBe(10)
  })

  it('rejects an invalid size', () => {
    expect(() => createEnsemble({ base, seed: 1, size: 0, sigma: 1 })).toThrow(RangeError)
    expect(() => createEnsemble({ base, seed: 1, size: 65, sigma: 1 })).toThrow(RangeError)
  })

  it('matches the base field when sigma is zero', () => {
    const ensemble = createEnsemble({ base, seed: 1, size: 4, sigma: 0 })
    const expected = deformPolygon(polygon, base, 1).vertices
    for (const field of ensemble) {
      expect(Array.from(deformPolygon(polygon, field, 1).vertices)).toEqual(Array.from(expected))
    }
  })

  it('is reproducible from the same seed', () => {
    const a = ensembleOutlines(polygon, createEnsemble({ base, seed: 3, size: 5, sigma: 1 }), 1)
    const b = ensembleOutlines(polygon, createEnsemble({ base, seed: 3, size: 5, sigma: 1 }), 1)
    expect(Array.from(a)).toEqual(Array.from(b))
  })

  it('lays out one outline per member', () => {
    const outline = ensembleOutlines(
      polygon,
      createEnsemble({ base, seed: 1, size: 7, sigma: 1 }),
      0.5,
    )
    expect(outline.length).toBe(7 * polygon.vertices.length)
  })
})
