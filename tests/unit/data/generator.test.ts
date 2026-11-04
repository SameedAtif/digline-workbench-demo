import { describe, expect, it } from 'vitest'

import { defaultBenchParams, generateBench } from '@/data'

const base = {
  ...defaultBenchParams(1234),
  nx: 10,
  ny: 2,
  nz: 10,
}

describe('generateBench', () => {
  it('produces exactly nx * ny * nz blocks', () => {
    const model = generateBench(base)
    expect(model.count).toBe(200)
  })

  it('is byte-identical for the same seed', () => {
    const a = generateBench(base)
    const b = generateBench(base)
    expect(Array.from(a.grade)).toEqual(Array.from(b.grade))
    expect(Array.from(a.x)).toEqual(Array.from(b.x))
  })

  it('changes with a different seed', () => {
    const a = generateBench(base)
    const b = generateBench({ ...base, seed: 999 })
    expect(Array.from(a.grade)).not.toEqual(Array.from(b.grade))
  })

  it('keeps grade finite and non-negative', () => {
    const model = generateBench(base)
    for (const grade of model.grade) {
      expect(Number.isFinite(grade)).toBe(true)
      expect(grade).toBeGreaterThanOrEqual(0)
    }
  })

  it('scales tonnes with cell size cubed', () => {
    const a = generateBench(base)
    const b = generateBench({ ...base, cellSize: base.cellSize * 2 })
    const ratio = (b.tonnes[0] ?? 0) / (a.tonnes[0] ?? 1)
    expect(ratio).toBeCloseTo(8, 5)
  })

  it('only emits the three known material ids', () => {
    const model = generateBench(base)
    const ids = new Set(Array.from(model.material))
    for (const id of ids) {
      expect([0, 1, 2]).toContain(id)
    }
  })
})
