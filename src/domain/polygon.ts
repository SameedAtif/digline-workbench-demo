import type { Bounds2, Vec2 } from '@/types'

import { modelBounds, type BlockModel } from './block'
import { metres, type Metres } from './units'

export interface Polygon {
  /** Flat x,z pairs: [x0, z0, x1, z1, …]. */
  readonly vertices: Float32Array
  readonly closed: boolean
  readonly planeY: Metres
}

function validateVertices(vertices: Float32Array): void {
  if (vertices.length % 2 !== 0) {
    throw new RangeError('polygon vertices must be an even-length x,z flat array')
  }
  for (let i = 0; i < vertices.length; i += 1) {
    const value = vertices[i]
    if (value === undefined || !Number.isFinite(value)) {
      throw new TypeError(`polygon vertex component at ${i} must be finite`)
    }
  }
}

/** Smart constructor for polygons. */
export function createPolygon(
  vertices: Float32Array,
  planeY: Metres | number,
  closed = false,
): Polygon {
  validateVertices(vertices)
  return {
    vertices,
    closed,
    planeY: typeof planeY === 'number' ? metres(planeY) : planeY,
  }
}

export function vertexCount(polygon: Polygon): number {
  return polygon.vertices.length / 2
}

export function vertexAt(polygon: Polygon, index: number): Vec2 {
  const x = polygon.vertices[index * 2]
  const z = polygon.vertices[index * 2 + 1]
  if (x === undefined || z === undefined) {
    throw new RangeError(`polygon vertex ${index} is out of range`)
  }
  return [x, z]
}

/** Shoelace area. Always non-negative. Open polygons are implicitly closed for area. */
export function area(polygon: Polygon): number {
  return areaOfFlat(polygon.vertices)
}

export function areaOfFlat(vertices: Float32Array): number {
  const n = vertices.length / 2
  if (n < 3) return 0
  let sum = 0
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n
    const xi = vertices[i * 2] ?? 0
    const zi = vertices[i * 2 + 1] ?? 0
    const xj = vertices[j * 2] ?? 0
    const zj = vertices[j * 2 + 1] ?? 0
    sum += xi * zj - xj * zi
  }
  return Math.abs(sum) * 0.5
}

/** Area-weighted centroid, falling back to the mean vertex for degenerate polygons. */
export function centroid(polygon: Polygon): Vec2 {
  const v = polygon.vertices
  const n = v.length / 2
  if (n === 0) return [0, 0]
  if (n < 3) return meanVertex(v)

  let crossSum = 0
  let cx = 0
  let cz = 0
  for (let i = 0; i < n; i += 1) {
    const j = (i + 1) % n
    const xi = v[i * 2] ?? 0
    const zi = v[i * 2 + 1] ?? 0
    const xj = v[j * 2] ?? 0
    const zj = v[j * 2 + 1] ?? 0
    const cross = xi * zj - xj * zi
    crossSum += cross
    cx += (xi + xj) * cross
    cz += (zi + zj) * cross
  }

  if (Math.abs(crossSum) < 1e-12) return meanVertex(v)
  const factor = 1 / (3 * crossSum)
  return [cx * factor, cz * factor]
}

function meanVertex(v: Float32Array): Vec2 {
  const n = v.length / 2
  let sx = 0
  let sz = 0
  for (let i = 0; i < n; i += 1) {
    sx += v[i * 2] ?? 0
    sz += v[i * 2 + 1] ?? 0
  }
  return [sx / n, sz / n]
}

/** Crossing-number point-in-polygon. A point exactly on the boundary is treated as inside. */
export function pointInPolygon(polygon: Polygon, x: number, z: number): boolean {
  return pointInFlatPolygon(polygon.vertices, x, z)
}

export function pointInFlatPolygon(vertices: Float32Array, x: number, z: number): boolean {
  const n = vertices.length / 2
  if (n < 3) return false

  let inside = false
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const xi = vertices[i * 2] ?? 0
    const zi = vertices[i * 2 + 1] ?? 0
    const xj = vertices[j * 2] ?? 0
    const zj = vertices[j * 2 + 1] ?? 0

    const onEdge =
      Math.abs((xj - xi) * (z - zi) - (x - xi) * (zj - zi)) < 1e-9 &&
      x >= Math.min(xi, xj) - 1e-9 &&
      x <= Math.max(xi, xj) + 1e-9 &&
      z >= Math.min(zi, zj) - 1e-9 &&
      z <= Math.max(zi, zj) + 1e-9
    if (onEdge) return true

    const intersects = zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

export function aabb(polygon: Polygon): Bounds2 {
  return aabbOfFlat(polygon.vertices)
}

export function aabbOfFlat(vertices: Float32Array): Bounds2 {
  let minX = Infinity
  let maxX = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity
  for (let i = 0; i < vertices.length; i += 2) {
    const x = vertices[i] ?? 0
    const z = vertices[i + 1] ?? 0
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }
  if (vertices.length === 0) {
    return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }
  }
  return { minX, maxX, minZ, maxZ }
}

/** A deterministic demo dig line centred on the bench, for first-run orientation. */
export function exampleOrePolygonVertices(model: BlockModel): Float32Array {
  const bounds = modelBounds(model)
  const cx = (bounds.minX + bounds.maxX) / 2
  const cz = (bounds.minZ + bounds.maxZ) / 2
  const rx = (bounds.maxX - bounds.minX) * 0.17
  const rz = (bounds.maxZ - bounds.minZ) * 0.15
  const radii = [1, 0.88, 1.04, 0.94, 1.02, 0.9, 1.06, 0.96]
  const out = new Float32Array(radii.length * 2)
  radii.forEach((scale, i) => {
    const angle = (i / radii.length) * Math.PI * 2 + Math.PI / 8
    out[i * 2] = cx + Math.cos(angle) * rx * scale
    out[i * 2 + 1] = cz + Math.sin(angle) * rz * scale
  })
  return out
}
