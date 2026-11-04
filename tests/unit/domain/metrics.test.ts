import { describe, expect, it } from 'vitest'

import {
  baselineOre,
  createBlockModel,
  createPolygon,
  dilution,
  oreLoss,
  polygonMeanGrade,
  polygonTonnes,
  UniformField,
} from '@/domain'

function buildModel(tonnesPerBlock = 1) {
  return createBlockModel({
    x: new Float32Array([0.5, 1.5]),
    y: new Float32Array([0.5, 0.5]),
    z: new Float32Array([0.5, 0.5]),
    size: new Float32Array([1, 1]),
    grade: new Float32Array([2, 0]),
    material: new Uint8Array([1, 0]),
    tonnes: new Float32Array([tonnesPerBlock, tonnesPerBlock]),
  })
}

const polygon = createPolygon(new Float32Array([0, 0, 2, 0, 2, 1, 0, 1]), 1, true)
const field = new UniformField({ dx: 0, dz: 0 })

describe('metrics', () => {
  it('matches the baseline at t = 0', () => {
    const model = buildModel()
    const baseline = baselineOre(model, polygon, 1)
    expect(baseline.tonnes).toBe(1)
    expect(polygonTonnes(model, polygon, field, 0, 1)).toBe(1)
    expect(baseline.meanGrade).toBe(2)
    expect(dilution(model, polygon, field, 0, baseline)).toBe(0)
    expect(oreLoss(model, polygon, field, 0, baseline)).toBe(0)
  })

  it('uses tonnage-weighted mean grade', () => {
    const model = buildModel()
    expect(polygonMeanGrade(model, polygon, field, 0, 1)).toBe(2)
  })

  it('scales tonnes linearly', () => {
    const small = buildModel(1)
    const large = buildModel(2)
    expect(polygonTonnes(large, polygon, field, 0, 1)).toBeCloseTo(
      2 * polygonTonnes(small, polygon, field, 0, 1),
      6,
    )
  })

  it('keeps dilution and ore loss in [0, 1]', () => {
    const model = buildModel()
    const baseline = baselineOre(model, polygon, 1)
    const dil = dilution(model, polygon, field, 1, baseline)
    const loss = oreLoss(model, polygon, field, 1, baseline)
    expect(dil).toBeGreaterThanOrEqual(0)
    expect(dil).toBeLessThanOrEqual(1)
    expect(loss).toBeGreaterThanOrEqual(0)
    expect(loss).toBeLessThanOrEqual(1)
  })

  it('never increases baseline ore tonnes when the cutoff rises', () => {
    const model = buildModel()
    const low = baselineOre(model, polygon, 0)
    const high = baselineOre(model, polygon, 1)
    expect(high.tonnes).toBeLessThanOrEqual(low.tonnes)
  })
})
