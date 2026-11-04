import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  PlaneHelper,
  Vector3,
} from 'three'

export interface SlicePlaneOptions {
  width: number
  height: number
  centerY: number
  centerZ: number
}

export interface SlicePlane {
  readonly object: Group
  readonly plane: Plane
  setEnabled(enabled: boolean): void
  setPosition(x: number): void
  dispose(): void
}

export function createSlicePlane(options: SlicePlaneOptions): SlicePlane {
  const group = new Group()
  group.name = 'slice-plane'

  const plane = new Plane(new Vector3(-1, 0, 0), 0)

  const geometry = new PlaneGeometry(options.width, options.height)
  const material = new MeshBasicMaterial({
    color: 0x46b3a5,
    transparent: true,
    opacity: 0.07,
    side: DoubleSide,
    depthWrite: false,
  })
  const handle = new Mesh(geometry, material)
  handle.rotation.y = Math.PI / 2
  handle.position.y = options.centerY
  handle.position.z = options.centerZ

  const helper = new PlaneHelper(plane, options.width, 0x46b3a5)
  helper.position.y = options.centerY
  helper.position.z = options.centerZ

  group.add(handle, helper)
  group.visible = false

  return {
    object: group,
    plane,
    setEnabled: (enabled) => {
      group.visible = enabled
    },
    setPosition: (x) => {
      plane.constant = x
      handle.position.x = x
      helper.position.x = x
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
      helper.geometry.dispose()
      const helperMaterial = helper.material
      if (Array.isArray(helperMaterial)) helperMaterial.forEach((m) => m.dispose())
      else helperMaterial.dispose()
      group.clear()
    },
  }
}
