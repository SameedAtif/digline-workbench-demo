import { cloneBlockModel, type BlockModel } from './block'
import { createPolygon, type Polygon } from './polygon'
import type { VectorField } from './vector-field'

/**
 * Applies `t * field.sample(position0)` to every block centroid.
 * Immutable: the input model is never touched.
 */
export function applyField(model: BlockModel, field: VectorField, t: number): BlockModel {
  const next = cloneBlockModel(model)
  if (t === 0) return next
  for (let i = 0; i < model.count; i += 1) {
    const x0 = model.x[i] ?? 0
    const y0 = model.y[i] ?? 0
    const z0 = model.z[i] ?? 0
    const [dx, dy, dz] = field.sample(x0, y0, z0)
    next.x[i] = x0 + t * dx
    next.y[i] = y0 + t * dy
    next.z[i] = z0 + t * dz
  }
  return next
}

/** Applies the same field to a polygon's vertices, sampled at the polygon's plane. */
export function deformPolygon(polygon: Polygon, field: VectorField, t: number): Polygon {
  const out = new Float32Array(polygon.vertices.length)
  const planeY = polygon.planeY as number
  for (let i = 0; i < polygon.vertices.length; i += 2) {
    const x0 = polygon.vertices[i] ?? 0
    const z0 = polygon.vertices[i + 1] ?? 0
    const [dx, dy, dz] = field.sample(x0, planeY, z0)
    out[i] = x0 + t * dx
    out[i + 1] = z0 + t * dz
    // Vertical deformation is intentionally not applied to the 2D dig-line; the
    // plan-view polygon is what the geologist marks up. `dy` is kept for blocks.
    void dy
  }
  return createPolygon(out, polygon.planeY, polygon.closed)
}

/** Samples a deformed polygon's vertices without allocating a Polygon wrapper. */
export function deformedVerticesFlat(
  vertices: Float32Array,
  planeY: number,
  field: VectorField,
  t: number,
): Float32Array {
  const out = new Float32Array(vertices.length)
  for (let i = 0; i < vertices.length; i += 2) {
    const x0 = vertices[i] ?? 0
    const z0 = vertices[i + 1] ?? 0
    const [dx, , dz] = field.sample(x0, planeY, z0)
    out[i] = x0 + t * dx
    out[i + 1] = z0 + t * dz
  }
  return out
}
