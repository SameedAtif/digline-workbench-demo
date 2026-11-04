import earcut from 'earcut'
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
} from 'three'

import { deformedVerticesFlat, type Polygon, type VectorField } from '@/domain'

const ACCENT = 0x72e6d4
const CORE = 0xd6fff8

export interface PolygonLayerInput {
  polygon: Polygon
  field: VectorField
  t: number
  showHandles: boolean
}

export interface PolygonLayer {
  readonly object: Group
  update(input: PolygonLayerInput): void
  setResolution(width: number, height: number): void
  dispose(): void
}

interface FillState {
  verticesRef: Float32Array | null
  count: number
  closed: boolean
  indices: number[]
}

/**
 * Builds a flat ribbon along the polygon edges. A world-space ribbon reads much
 * better than a 1px line and behaves the same at every zoom level.
 */
function buildRibbon(
  vertices: Float32Array,
  planeY: number,
  closed: boolean,
  halfWidth: number,
): Float32Array {
  const n = vertices.length / 2
  if (n < 2) return new Float32Array(0)
  const segments = closed && n >= 3 ? n : n - 1
  const out = new Float32Array(segments * 6 * 3)
  const y = planeY + 0.55
  let written = 0

  for (let i = 0; i < segments; i += 1) {
    const j = (i + 1) % n
    const x0 = vertices[i * 2] ?? 0
    const z0 = vertices[i * 2 + 1] ?? 0
    const x1 = vertices[j * 2] ?? 0
    const z1 = vertices[j * 2 + 1] ?? 0
    const dx = x1 - x0
    const dz = z1 - z0
    const length = Math.hypot(dx, dz)
    if (length < 1e-6) continue

    const px = (-dz / length) * halfWidth
    const pz = (dx / length) * halfWidth

    const ax = x0 + px
    const az = z0 + pz
    const bx = x1 + px
    const bz = z1 + pz
    const cx = x1 - px
    const cz = z1 - pz
    const dx0 = x0 - px
    const dz0 = z0 - pz

    out.set([ax, y, az, bx, y, bz, cx, y, cz, ax, y, az, cx, y, cz, dx0, y, dz0], written)
    written += 18
  }

  return out.subarray(0, written)
}

export function createPolygonLayer(): PolygonLayer {
  const group = new Group()
  group.name = 'polygon-layer'

  const glowGeometry = new BufferGeometry()
  const glowMaterial = new MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.22,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
  })
  const glow = new Mesh(glowGeometry, glowMaterial)
  glow.frustumCulled = false
  glow.visible = false
  glow.renderOrder = 4

  const outlineGeometry = new BufferGeometry()
  const outlineMaterial = new MeshBasicMaterial({
    color: CORE,
    depthTest: false,
    depthWrite: false,
    side: DoubleSide,
  })
  const outline = new Mesh(outlineGeometry, outlineMaterial)
  outline.frustumCulled = false
  outline.visible = false
  outline.renderOrder = 5

  const fillGeometry = new BufferGeometry()
  const fillMaterial = new MeshBasicMaterial({
    color: ACCENT,
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
    side: DoubleSide,
  })
  const fill = new Mesh(fillGeometry, fillMaterial)
  fill.frustumCulled = false
  fill.visible = false
  fill.renderOrder = 3

  const handleGeometry = new SphereGeometry(2.4, 16, 12)
  const handleMaterial = new MeshBasicMaterial({ color: 0xe8f4f2, depthTest: false })
  const handles = new InstancedMesh(handleGeometry, handleMaterial, 512)
  handles.frustumCulled = false
  handles.count = 0
  handles.renderOrder = 6

  group.add(fill, glow, outline, handles)

  const fillState: FillState = { verticesRef: null, count: 0, closed: false, indices: [] }
  const dummy = new Object3D()

  const update = (input: PolygonLayerInput): void => {
    const { polygon, field, t, showHandles } = input
    const n = polygon.vertices.length / 2
    const planeY = polygon.planeY as number

    if (n === 0) {
      outline.visible = false
      glow.visible = false
      fill.visible = false
      handles.count = 0
      return
    }

    const deformed = deformedVerticesFlat(polygon.vertices, planeY, field, t)

    const corePositions = buildRibbon(deformed, planeY, polygon.closed, 0.9)
    const glowPositions = buildRibbon(deformed, planeY, polygon.closed, 2.5)
    outlineGeometry.setAttribute('position', new Float32BufferAttribute(corePositions, 3))
    glowGeometry.setAttribute('position', new Float32BufferAttribute(glowPositions, 3))
    outline.visible = corePositions.length > 0
    glow.visible = glowPositions.length > 0

    // Fill: retriangulate only when the source vertices change.
    if (
      fillState.verticesRef !== polygon.vertices ||
      fillState.count !== n ||
      fillState.closed !== polygon.closed
    ) {
      fillState.verticesRef = polygon.vertices
      fillState.count = n
      fillState.closed = polygon.closed
      fillState.indices = n >= 3 && polygon.closed ? earcut(Array.from(polygon.vertices)) : []
      fillGeometry.setIndex(fillState.indices)
    }

    if (fillState.indices.length > 0) {
      const positions = new Float32Array(n * 3)
      for (let i = 0; i < n; i += 1) {
        positions[i * 3] = deformed[i * 2] ?? 0
        positions[i * 3 + 1] = planeY + 0.4
        positions[i * 3 + 2] = deformed[i * 2 + 1] ?? 0
      }
      const existing = fillGeometry.getAttribute('position')
      if (existing && existing.count === n) {
        ;(existing.array as Float32Array).set(positions)
        existing.needsUpdate = true
      } else {
        fillGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
      }
      fill.visible = true
    } else {
      fill.visible = false
    }

    // Vertex handles.
    const visibleHandles = showHandles ? Math.min(n, handles.instanceMatrix.count) : 0
    handles.count = visibleHandles
    for (let i = 0; i < visibleHandles; i += 1) {
      dummy.position.set(deformed[i * 2] ?? 0, planeY + 1.0, deformed[i * 2 + 1] ?? 0)
      dummy.updateMatrix()
      handles.setMatrixAt(i, dummy.matrix)
    }
    handles.instanceMatrix.needsUpdate = true
  }

  return {
    object: group,
    update,
    setResolution: () => {
      // The ribbon uses world-space width, so it needs no resolution update.
    },
    dispose: () => {
      outlineGeometry.dispose()
      outlineMaterial.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
      fillGeometry.dispose()
      fillMaterial.dispose()
      handleGeometry.dispose()
      handleMaterial.dispose()
      handles.dispose()
      group.clear()
    },
  }
}
