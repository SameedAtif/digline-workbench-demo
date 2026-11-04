import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  DynamicDrawUsage,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

import type { VectorField } from '@/domain'
import type { Bounds3 } from '@/types'

const ARROW_LENGTH = 2.4
const GRID = 10
const MAX_ARROWS = GRID * GRID
const UP = new Vector3(0, 1, 0)

export interface FieldArrows {
  readonly object: InstancedMesh
  update(field: VectorField, bounds: Bounds3): void
  dispose(): void
}

export function createFieldArrows(): FieldArrows {
  const shaft = new CylinderGeometry(0.32, 0.32, 1, 6, 1)
  shaft.translate(0, 0.5, 0)
  const head = new ConeGeometry(1.0, 1.4, 8, 1)
  head.translate(0, 1.7, 0)
  const merged = mergeGeometries([shaft, head])
  shaft.dispose()
  head.dispose()
  if (!merged) throw new Error('failed to build arrow geometry')

  const material = new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    depthTest: false,
    depthWrite: false,
  })
  const mesh = new InstancedMesh(merged, material, MAX_ARROWS)
  mesh.instanceMatrix.setUsage(DynamicDrawUsage)
  mesh.frustumCulled = false
  mesh.count = 0
  mesh.name = 'field-arrows'
  mesh.renderOrder = 7

  const dummy = new Object3D()
  const quaternion = new Quaternion()
  const direction = new Vector3()
  const low = new Color(0x46b3a5)
  const high = new Color(0xffd166)
  const mixed = new Color()

  const update = (field: VectorField, bounds: Bounds3): void => {
    const planeY = bounds.maxY
    const width = Math.max(1, bounds.maxX - bounds.minX)
    const depth = Math.max(1, bounds.maxZ - bounds.minZ)
    const pad = Math.min(width, depth) * 0.04
    const usableWidth = width - pad * 2
    const usableDepth = depth - pad * 2
    let written = 0

    for (let iz = 0; iz < GRID; iz += 1) {
      for (let ix = 0; ix < GRID; ix += 1) {
        const x = bounds.minX + pad + (usableWidth * ix) / (GRID - 1)
        const z = bounds.minZ + pad + (usableDepth * iz) / (GRID - 1)
        const sample = field.sample(x, planeY, z)
        const magnitude = Math.hypot(sample[0], sample[1], sample[2])
        if (magnitude < 0.05) continue

        direction.set(sample[0], sample[1], sample[2]).normalize()
        quaternion.setFromUnitVectors(UP, direction)
        const length = Math.max(3, magnitude * 0.8)

        dummy.position.set(x, planeY + 1.1, z)
        dummy.quaternion.copy(quaternion)
        dummy.scale.set(1.7, length / ARROW_LENGTH, 1.7)
        dummy.updateMatrix()
        mesh.setMatrixAt(written, dummy.matrix)

        mixed.copy(low).lerp(high, Math.min(1, magnitude / 28))
        mesh.setColorAt(written, mixed)
        written += 1
      }
    }

    mesh.count = written
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }

  return {
    object: mesh,
    update,
    dispose: () => {
      merged.dispose()
      material.dispose()
      mesh.dispose()
    },
  }
}
