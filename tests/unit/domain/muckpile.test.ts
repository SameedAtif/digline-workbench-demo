import { describe, expect, it } from 'vitest'

import { applyField, createBlockModel, settleToMuckpile, UniformField } from '@/domain'

function bench() {
  const count = 8
  const x = new Float32Array(count)
  const y = new Float32Array(count)
  const z = new Float32Array(count)
  for (let i = 0; i < count; i += 1) {
    x[i] = (i % 2) * 4 + 2
    y[i] = Math.floor(i / 2) * 4 + 2
    z[i] = 2
  }
  return createBlockModel({
    x,
    y,
    z,
    size: new Float32Array(count).fill(4),
    grade: new Float32Array(count).fill(2),
    material: new Uint8Array(count).fill(1),
    tonnes: new Float32Array(count).fill(172.8),
  })
}

describe('settleToMuckpile', () => {
  it('keeps plan positions and produces deterministic heights', () => {
    const model = bench()
    const moved = applyField(model, new UniformField({ dx: 6, dz: 8 }), 1)
    const xBefore = Array.from(moved.x)
    const zBefore = Array.from(moved.z)

    const first = settleToMuckpile(model, moved)
    const firstY = Array.from(first.y)
    const second = settleToMuckpile(model, applyField(model, new UniformField({ dx: 6, dz: 8 }), 1))

    expect(Array.from(first.x)).toEqual(xBefore)
    expect(Array.from(first.z)).toEqual(zBefore)
    expect(Array.from(second.y)).toEqual(firstY)
    for (const y of first.y) expect(Number.isFinite(y)).toBe(true)
  })
})
