import {
  deformedVerticesFlat,
  mulberry32,
  PerturbedField,
  type Polygon,
  type VectorField,
} from '@/domain'

export type Ensemble = ReadonlyArray<VectorField>

export interface EnsembleParams {
  base: VectorField
  seed: number
  size: number
  sigma: number
}

export function createEnsemble(params: EnsembleParams): Ensemble {
  const { base, seed, size, sigma } = params
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError(`ensemble size must be an integer >= 1, received ${size}`)
  }
  if (size > 64) {
    throw new RangeError(`ensemble size must be <= 64, received ${size}`)
  }

  const members: VectorField[] = []
  for (let i = 0; i < size; i += 1) {
    members.push(
      new PerturbedField({
        base,
        prng: mulberry32((seed + i * 7919) >>> 0),
        sigma,
      }),
    )
  }
  return members
}

/**
 * Builds a flat buffer of every member's deformed outline, laid out as
 * `member * vertexCount * 2` (x,z pairs).
 */
export function ensembleOutlines(polygon: Polygon, ensemble: Ensemble, t: number): Float32Array {
  const n = polygon.vertices.length
  const out = new Float32Array(ensemble.length * n)
  const planeY = polygon.planeY as number
  ensemble.forEach((field, member) => {
    const deformed = deformedVerticesFlat(polygon.vertices, planeY, field, t)
    out.set(deformed, member * n)
  })
  return out
}
