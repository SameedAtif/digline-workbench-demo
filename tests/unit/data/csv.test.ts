import { describe, expect, it } from 'vitest'

import { benchToCsv, defaultBenchParams, generateBench, parseCsvText } from '@/data'

const header = 'x,y,z,size,grade,material'

function rows(count: number): string {
  return Array.from({ length: count }, (_, i) => `${i + 0.5},0.5,0.5,1,2,1`).join('\n')
}

describe('parseCsvText', () => {
  it('parses a valid file', () => {
    const result = parseCsvText(`${header}\n${rows(10)}`)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.model.count).toBe(10)
      expect(result.model.tonnes[0]).toBeCloseTo(2.7, 6)
    }
  })

  it('rejects a file missing a required header', () => {
    const result = parseCsvText('x,y,z,size,material\n1,2,3,1,1')
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.summary.reasons[0]?.reason).toContain('missing header: grade')
    }
  })

  it('rejects the whole file when a row is invalid and names the line', () => {
    const bad = `${header}\n0.5,0.5,0.5,1,2,1\n1.5,0.5,0.5,1,abc,1\n2.5,0.5,0.5,1,2,1`
    const result = parseCsvText(bad)
    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.summary.rejected).toBe(1)
      expect(result.summary.reasons[0]?.line).toBe(3)
    }
  })

  it('round-trips a generated bench', () => {
    const model = generateBench({ ...defaultBenchParams(5), nx: 4, ny: 1, nz: 4 })
    const result = parseCsvText(benchToCsv(model))
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(result.model.count).toBe(model.count)
      expect(Array.from(result.model.grade)).toEqual(Array.from(model.grade))
    }
  })
})
