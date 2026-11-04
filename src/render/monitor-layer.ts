import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
} from 'three'

import type { MonitorEvaluation } from '@/domain'

export interface MonitorLayer {
  readonly object: Group
  update(evaluation: MonitorEvaluation): void
  dispose(): void
}

export function createMonitorLayer(): MonitorLayer {
  const group = new Group()
  group.name = 'monitor-layer'

  const markerGeometry = new SphereGeometry(3.0, 14, 12)
  const predictedMaterial = new MeshBasicMaterial({
    color: 0x25e6ff,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  const measuredMaterial = new MeshBasicMaterial({
    color: 0xff8c42,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
  const predicted = new InstancedMesh(markerGeometry, predictedMaterial, 64)
  const measured = new InstancedMesh(markerGeometry, measuredMaterial, 64)
  predicted.frustumCulled = false
  measured.frustumCulled = false
  predicted.renderOrder = 9
  measured.renderOrder = 9
  predicted.count = 0
  measured.count = 0

  const lineGeometry = new BufferGeometry()
  lineGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(64 * 2 * 3), 3))
  const lineMaterial = new LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    depthTest: false,
    depthWrite: false,
  })
  const lines = new LineSegments(lineGeometry, lineMaterial)
  lines.frustumCulled = false
  lines.renderOrder = 8

  group.add(predicted, measured, lines)

  const dummy = new Object3D()

  const update = (evaluation: MonitorEvaluation): void => {
    const count = Math.min(evaluation.points.length, predicted.instanceMatrix.count)
    predicted.count = count
    measured.count = count

    const attribute = lineGeometry.getAttribute('position')
    const positions = attribute.array as Float32Array

    evaluation.points.forEach((point, index) => {
      if (index >= count) return
      const predictedX = point.x + point.predicted[0]
      const predictedZ = point.z + point.predicted[2]
      const measuredX = point.x + point.measured[0]
      const measuredZ = point.z + point.measured[2]
      const y = point.y + 1.6

      dummy.position.set(predictedX, y, predictedZ)
      dummy.updateMatrix()
      predicted.setMatrixAt(index, dummy.matrix)

      dummy.position.set(measuredX, y, measuredZ)
      dummy.updateMatrix()
      measured.setMatrixAt(index, dummy.matrix)

      const offset = index * 6
      positions[offset] = predictedX
      positions[offset + 1] = y
      positions[offset + 2] = predictedZ
      positions[offset + 3] = measuredX
      positions[offset + 4] = y
      positions[offset + 5] = measuredZ
    })

    predicted.instanceMatrix.needsUpdate = true
    measured.instanceMatrix.needsUpdate = true
    attribute.needsUpdate = true
    lineGeometry.setDrawRange(0, count * 2)
    lines.visible = count > 0
  }

  return {
    object: group,
    update,
    dispose: () => {
      markerGeometry.dispose()
      predictedMaterial.dispose()
      measuredMaterial.dispose()
      predicted.dispose()
      measured.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      group.clear()
    },
  }
}
