import { describe, expect, it } from 'vitest'

import { materialId, metres, tonnes } from '@/domain'

describe('branded units', () => {
  it('rejects non-finite values', () => {
    expect(() => metres(Number.NaN)).toThrow(TypeError)
    expect(() => metres(Number.POSITIVE_INFINITY)).toThrow(TypeError)
    expect(() => tonnes(Number.NEGATIVE_INFINITY)).toThrow(TypeError)
  })

  it('accepts finite values', () => {
    expect(metres(12.5)).toBe(12.5)
    expect(tonnes(0)).toBe(0)
  })

  it('constrains material ids to integer bytes', () => {
    expect(materialId(1)).toBe(1)
    expect(() => materialId(1.5)).toThrow(RangeError)
    expect(() => materialId(-1)).toThrow(RangeError)
    expect(() => materialId(256)).toThrow(RangeError)
  })
})
