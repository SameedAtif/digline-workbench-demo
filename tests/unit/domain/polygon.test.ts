import fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { aabb, area, centroid, createPolygon, pointInPolygon } from '@/domain'

function square(size = 1, offsetX = 0, offsetZ = 0) {
  return createPolygon(
    new Float32Array([
      offsetX,
      offsetZ,
      offsetX + size,
      offsetZ,
      offsetX + size,
      offsetZ + size,
      offsetX,
      offsetZ + size,
    ]),
    0,
    true,
  )
}

describe('area', () => {
  it('returns the shoelace area of a unit square', () => {
    expect(area(square())).toBeCloseTo(1, 10)
  })

  it('is invariant under translation', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: -100, max: 100, noNaN: true, noDefaultInfinity: true }),
        (dx, dz) => {
          expect(area(square(2, dx, dz))).toBeCloseTo(4, 6)
        },
      ),
      { numRuns: 200 },
    )
  })

  it('scales by k squared', () => {
    fc.assert(
      fc.property(fc.double({ min: 0.1, max: 10, noNaN: true, noDefaultInfinity: true }), (k) => {
        expect(area(square(k))).toBeCloseTo(k * k, 4)
      }),
      { numRuns: 200 },
    )
  })
})

describe('centroid', () => {
  it('is the centre of a square', () => {
    const [x, z] = centroid(square(2, 5, 7))
    expect(x).toBeCloseTo(6, 6)
    expect(z).toBeCloseTo(8, 6)
  })
})

describe('pointInPolygon', () => {
  it('accepts the centroid and rejects far points', () => {
    const polygon = square(2, 10, 10)
    expect(pointInPolygon(polygon, 11, 11)).toBe(true)
    expect(pointInPolygon(polygon, 100, 100)).toBe(false)
  })

  it('treats boundary points consistently as inside', () => {
    const polygon = square(2, 0, 0)
    expect(pointInPolygon(polygon, 0, 1)).toBe(true)
    expect(pointInPolygon(polygon, 2, 1)).toBe(true)
  })
})

describe('aabb', () => {
  it('matches min and max over vertices', () => {
    const box = aabb(square(3, -2, 4))
    expect(box).toEqual({ minX: -2, maxX: 1, minZ: 4, maxZ: 7 })
  })
})
