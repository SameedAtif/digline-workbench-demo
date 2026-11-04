import { BufferGeometry, Float32BufferAttribute, Line, LineDashedMaterial } from 'three'

import type { BlockModel } from '@/domain'

export interface TraceLine {
  readonly object: Line
  update(model: BlockModel, post: BlockModel, index: number | null, t: number): void
  dispose(): void
}

export function createTraceLine(): TraceLine {
  const geometry = new BufferGeometry()
  const positions = new Float32Array(6)
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))

  const material = new LineDashedMaterial({
    color: 0xffd166,
    dashSize: 2.5,
    gapSize: 1.5,
    transparent: true,
    opacity: 0.95,
  })

  const line = new Line(geometry, material)
  line.frustumCulled = false
  line.visible = false

  const update = (model: BlockModel, post: BlockModel, index: number | null, t: number): void => {
    if (index === null || index < 0 || index >= model.count) {
      line.visible = false
      return
    }

    const x0 = model.x[index] ?? 0
    const y0 = model.y[index] ?? 0
    const z0 = model.z[index] ?? 0
    const x1 = post.x[index] ?? x0
    const y1 = post.y[index] ?? y0
    const z1 = post.z[index] ?? z0

    const tClamped = Math.max(0, Math.min(1, t))
    const cx = x0 + (x1 - x0) * tClamped
    const cy = y0 + (y1 - y0) * tClamped
    const cz = z0 + (z1 - z0) * tClamped

    positions[0] = x0
    positions[1] = y0
    positions[2] = z0
    positions[3] = cx
    positions[4] = cy
    positions[5] = cz

    const attribute = geometry.getAttribute('position')
    attribute.needsUpdate = true
    line.computeLineDistances()
    line.visible = Math.hypot(cx - x0, cy - y0, cz - z0) > 0.05
  }

  return {
    object: line,
    update,
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}
