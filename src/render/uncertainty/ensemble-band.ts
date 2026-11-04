import { BufferGeometry, Float32BufferAttribute, Group, Line, LineBasicMaterial } from 'three'

import { deformedVerticesFlat, type Polygon, type VectorField } from '@/domain'
import type { Ensemble } from '@/uncertainty'

const ACCENT = 0x7ef0df

export interface EnsembleBandInput {
  polygon: Polygon
  ensemble: Ensemble
  t: number
}

export interface EnsembleBand {
  readonly object: Group
  update(input: EnsembleBandInput): void
  dispose(): void
}

export function createEnsembleBand(): EnsembleBand {
  const group = new Group()
  group.name = 'ensemble-band'
  const material = new LineBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    depthTest: false,
  })
  let lines: Line[] = []

  const ensureLines = (count: number): void => {
    if (lines.length === count) return
    for (const line of lines) {
      group.remove(line)
      line.geometry.dispose()
    }
    lines = []
    for (let i = 0; i < count; i += 1) {
      const line = new Line(new BufferGeometry(), material)
      line.frustumCulled = false
      line.renderOrder = 6
      group.add(line)
      lines.push(line)
    }
  }

  const update = (input: EnsembleBandInput): void => {
    const { polygon, ensemble, t } = input
    const n = polygon.vertices.length / 2
    if (n < 2 || ensemble.length === 0) {
      group.visible = false
      return
    }
    group.visible = true
    ensureLines(ensemble.length)

    const planeY = polygon.planeY as number
    ensemble.forEach((field: VectorField, index) => {
      const line = lines[index]
      if (!line) return
      const deformed = deformedVerticesFlat(polygon.vertices, planeY, field, t)
      const loop = polygon.closed ? n + 1 : n
      const positions = new Float32Array(loop * 3)
      for (let i = 0; i < loop; i += 1) {
        const src = i % n
        positions[i * 3] = deformed[src * 2] ?? 0
        positions[i * 3 + 1] = planeY + 0.7
        positions[i * 3 + 2] = deformed[src * 2 + 1] ?? 0
      }
      const existing = line.geometry.getAttribute('position')
      if (existing && existing.count === loop) {
        ;(existing.array as Float32Array).set(positions)
        existing.needsUpdate = true
      } else {
        line.geometry.dispose()
        line.geometry = new BufferGeometry()
        line.geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
      }
    })
  }

  return {
    object: group,
    update,
    dispose: () => {
      for (const line of lines) {
        group.remove(line)
        line.geometry.dispose()
      }
      lines = []
      material.dispose()
      group.clear()
    },
  }
}
