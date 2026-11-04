import type { BlockModel } from './block'
import { deformPolygon, deformedVerticesFlat } from './apply'
import { aabbOfFlat, pointInFlatPolygon, pointInPolygon, type Polygon } from './polygon'
import type { VectorField } from './vector-field'

export interface Baseline {
  /** Indices of blocks that were ore and inside the polygon at t = 0. */
  readonly indices: Uint32Array
  /** Sparse membership flags for the ore set, indexed by block index. */
  readonly oreFlags: Uint8Array
  /** Sparse membership flags for *all* blocks inside polygon0 at t = 0. */
  readonly insideFlags: Uint8Array
  readonly tonnes: number
  readonly weightedGrade: number
  readonly meanGrade: number
}

/**
 * Snapshot of the dig line at t = 0. Computed once per polygon edit and reused
 * for every scrub tick.
 */
export function baselineOre(model: BlockModel, polygon0: Polygon, cutoff: number): Baseline {
  const oreFlags = new Uint8Array(model.count)
  const insideFlags = new Uint8Array(model.count)
  const indices: number[] = []
  let tonnes = 0
  let weightedGrade = 0

  const bounds = aabbOfFlat(polygon0.vertices)

  for (let i = 0; i < model.count; i += 1) {
    const x = model.x[i] ?? 0
    const z = model.z[i] ?? 0
    if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) continue
    if (!pointInPolygon(polygon0, x, z)) continue

    insideFlags[i] = 1
    const grade = model.grade[i] ?? 0
    if (grade >= cutoff) {
      oreFlags[i] = 1
      indices.push(i)
      const t = model.tonnes[i] ?? 0
      tonnes += t
      weightedGrade += t * grade
    }
  }

  return {
    indices: Uint32Array.from(indices),
    oreFlags,
    insideFlags,
    tonnes,
    weightedGrade,
    meanGrade: tonnes > 0 ? weightedGrade / tonnes : 0,
  }
}

interface Deformed {
  readonly vertices: Float32Array
  readonly bounds: { minX: number; maxX: number; minZ: number; maxZ: number }
}

function deform(polygon: Polygon, field: VectorField, t: number): Deformed {
  const vertices = deformedVerticesFlat(polygon.vertices, polygon.planeY as number, field, t)
  return { vertices, bounds: aabbOfFlat(vertices) }
}

/**
 * Tonnes of ore (grade ≥ cutoff) whose post-blast centroid lies inside the
 * deformed polygon.
 */
export function polygonTonnes(
  model: BlockModel,
  polygon: Polygon,
  field: VectorField,
  t: number,
  cutoff: number,
): number {
  return accumulate(model, polygon, field, t, cutoff).tonnes
}

/** Tonnage-weighted mean grade of the ore inside the deformed polygon. */
export function polygonMeanGrade(
  model: BlockModel,
  polygon: Polygon,
  field: VectorField,
  t: number,
  cutoff: number,
): number {
  const acc = accumulate(model, polygon, field, t, cutoff)
  return acc.tonnes > 0 ? acc.weightedGrade / acc.tonnes : 0
}

function accumulate(
  model: BlockModel,
  polygon: Polygon,
  field: VectorField,
  t: number,
  cutoff: number,
): { tonnes: number; weightedGrade: number } {
  const { vertices, bounds } = deform(polygon, field, t)
  let tonnes = 0
  let weightedGrade = 0

  for (let i = 0; i < model.count; i += 1) {
    const grade = model.grade[i] ?? 0
    if (grade < cutoff) continue
    const x0 = model.x[i] ?? 0
    const y0 = model.y[i] ?? 0
    const z0 = model.z[i] ?? 0
    const [dx, , dz] = field.sample(x0, y0, z0)
    const x = x0 + t * dx
    const z = z0 + t * dz
    if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) continue
    if (!pointInFlatPolygon(vertices, x, z)) continue
    const wt = model.tonnes[i] ?? 0
    tonnes += wt
    weightedGrade += wt * grade
  }

  return { tonnes, weightedGrade }
}

/**
 * Fraction of tonnes inside the polygon at time t that were not inside the
 * baseline polygon at t = 0. Zero at t = 0 by construction.
 */
export function dilution(
  model: BlockModel,
  polygon: Polygon,
  field: VectorField,
  t: number,
  baseline: Baseline,
): number {
  const { vertices, bounds } = deform(polygon, field, t)
  let totalInside = 0
  let baselineInside = 0

  for (let i = 0; i < model.count; i += 1) {
    const x0 = model.x[i] ?? 0
    const y0 = model.y[i] ?? 0
    const z0 = model.z[i] ?? 0
    const [dx, , dz] = field.sample(x0, y0, z0)
    const x = x0 + t * dx
    const z = z0 + t * dz
    if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) continue
    if (!pointInFlatPolygon(vertices, x, z)) continue
    const wt = model.tonnes[i] ?? 0
    totalInside += wt
    if (baseline.insideFlags[i] === 1) baselineInside += wt
  }

  if (totalInside <= 0) return 0
  return clamp01((totalInside - baselineInside) / totalInside)
}

/**
 * Fraction of baseline-ore tonnes whose post-blast centroid is not inside the
 * deformed polygon.
 */
export function oreLoss(
  model: BlockModel,
  polygon: Polygon,
  field: VectorField,
  t: number,
  baseline: Baseline,
): number {
  if (baseline.tonnes <= 0) return 0
  const { vertices, bounds } = deform(polygon, field, t)
  let retained = 0

  for (const i of baseline.indices) {
    const x0 = model.x[i] ?? 0
    const y0 = model.y[i] ?? 0
    const z0 = model.z[i] ?? 0
    const [dx, , dz] = field.sample(x0, y0, z0)
    const x = x0 + t * dx
    const z = z0 + t * dz
    if (x < bounds.minX || x > bounds.maxX || z < bounds.minZ || z > bounds.maxZ) continue
    if (pointInFlatPolygon(vertices, x, z)) retained += model.tonnes[i] ?? 0
  }

  return clamp01((baseline.tonnes - retained) / baseline.tonnes)
}

/** Deformed polygon helper kept here so callers do not need `apply` directly. */
export function deformedPolygon(polygon: Polygon, field: VectorField, t: number): Polygon {
  return deformPolygon(polygon, field, t)
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}
