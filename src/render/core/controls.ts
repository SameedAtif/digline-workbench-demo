import type { PerspectiveCamera } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function createControls(camera: PerspectiveCamera, element: HTMLElement): OrbitControls {
  const controls = new OrbitControls(camera, element)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.rotateSpeed = 0.6
  controls.panSpeed = 0.8
  controls.zoomSpeed = 0.9
  controls.minDistance = 5
  controls.maxDistance = 4000
  controls.target.set(0, 0, 0)
  controls.update()
  return controls
}
