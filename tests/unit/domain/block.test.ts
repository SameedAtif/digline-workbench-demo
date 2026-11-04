import { describe, expect, it } from 'vitest'

import { cloneBlockModel, createBlockModel, modelBounds } from '@/domain'

function buffers(count = 2) {
  return {
    x: new Float32Array(Array.from({ length: count }, (_, i) => i + 0.5)),
    y: new Float32Array(count).fill(0.5),
    z: new Float32Array(count).fill(0.5),
    size: new Float32Array(count).fill(1),
    grade: new Float32Array(count).fill(2),
    material: new Uint8Array(count).fill(1),
    tonnes: new Float32Array(count).fill(2.7),
  }
}

describe('createBlockModel', () => {
  it('derives count from the buffers', () => {
    const model = createBlockModel(buffers(3))
    expect(model.count).toBe(3)
  })

  it('rejects mismatched array lengths', () => {
    const input = buffers(2)
    input.grade = new Float32Array(3)
    expect(() => createBlockModel(input)).toThrow(RangeError)
  })

  it('rejects non-finite values', () => {
    const input = buffers(2)
    input.grade[1] = Number.NaN
    expect(() => createBlockModel(input)).toThrow(TypeError)
  })
})

describe('cloneBlockModel', () => {
  it('copies content with independent buffers', () => {
    const model = createBlockModel(buffers(2))
    const clone = cloneBlockModel(model)
    expect(Array.from(clone.grade)).toEqual(Array.from(model.grade))
    model.grade[0] = 99
    expect(clone.grade[0]).not.toBe(99)
  })
})

describe('modelBounds', () => {
  it('accounts for block half-size', () => {
    const model = createBlockModel(buffers(2))
    const bounds = modelBounds(model)
    expect(bounds.minX).toBe(0)
    expect(bounds.maxX).toBe(2)
    expect(bounds.maxY).toBe(1)
  })
})
