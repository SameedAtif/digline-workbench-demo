import { PerspectiveCamera, Vector3 } from 'three'

import type { Bounds3 } from '@/types'

export function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(45, 1, 0.5, 8000)
  camera.position.set(180, 160, 220)
  camera.lookAt(80, 0, 80)
  return camera
}

export function frameCameraToBounds(
  camera: PerspectiveCamera,
  target: { set(x: number, y: number, z: number): void },
  bounds: Bounds3,
): void {
  const cx = (bounds.minX + bounds.maxX) / 2
  const cy = (bounds.minY + bounds.maxY) / 2
  const cz = (bounds.minZ + bounds.maxZ) / 2
  const span = Math.max(
    bounds.maxX - bounds.minX,
    bounds.maxY - bounds.minY,
    bounds.maxZ - bounds.minZ,
  )
  const distance = Math.max(span * 1.7, 30)

  camera.position.set(cx + distance * 0.55, cy + distance * 0.75, cz + distance * 0.9)
  camera.near = Math.max(0.1, span / 2000)
  camera.far = Math.max(2000, span * 20)
  camera.updateProjectionMatrix()
  target.set(cx, cy, cz)
  camera.lookAt(new Vector3(cx, cy, cz))
}
