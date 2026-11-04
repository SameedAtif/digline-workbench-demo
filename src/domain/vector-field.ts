import type { Vec3 } from '@/types'

import { modelBounds, type BlockModel } from './block'
import { normal } from './prng'

export interface VectorField {
  readonly kind: string
  /** Displacement in metres for a point. */
  sample(x: number, y: number, z: number): Vec3
}

export interface UniformFieldParams {
  dx: number
  dz: number
  dy?: number
}

/** Constant translation; gravity-biased vertical drop is available via `dy`. */
export class UniformField implements VectorField {
  readonly kind = 'uniform'
  readonly dx: number
  readonly dz: number
  readonly dy: number

  constructor(params: UniformFieldParams) {
    this.dx = params.dx
    this.dz = params.dz
    this.dy = params.dy ?? 0
  }

  sample(_x: number, _y: number, _z: number): Vec3 {
    return [this.dx, this.dy, this.dz]
  }
}

export interface FreeFaceFieldParams {
  facePoint: Vec3
  faceNormal: Vec3
  maxThrow: number
  decay?: number
  verticalDrop?: number
  /** Extra attenuation of throw with depth below the face point. */
  verticalAttenuation?: number
  /** Outward X spread per metre of lateral distance from the blast centre. */
  lateralSpread?: number
  /** X coordinate the lateral spread is measured from. Defaults to the face point. */
  spreadCenter?: number
}

/**
 * Throw decays with distance from a free face, roughly inverse-square.
 * A deliberate simplification of blast movement, not a physics model.
 */
export class FreeFaceField implements VectorField {
  readonly kind = 'free-face'
  readonly facePoint: Vec3
  readonly faceNormal: Vec3
  readonly maxThrow: number
  readonly decay: number
  readonly verticalDrop: number
  readonly verticalAttenuation: number
  readonly lateralSpread: number
  readonly spreadCenter: number

  constructor(params: FreeFaceFieldParams) {
    this.facePoint = params.facePoint
    this.faceNormal = normalise(params.faceNormal)
    this.maxThrow = params.maxThrow
    this.decay = params.decay ?? 0.02
    this.verticalDrop = params.verticalDrop ?? 0.2
    this.verticalAttenuation = params.verticalAttenuation ?? 0.06
    this.lateralSpread = params.lateralSpread ?? 0
    this.spreadCenter = params.spreadCenter ?? params.facePoint[0]
  }

  sample(x: number, y: number, z: number): Vec3 {
    const [nx, ny, nz] = this.faceNormal
    const dx = x - this.facePoint[0]
    const dy = y - this.facePoint[1]
    const dz = z - this.facePoint[2]
    const distance = Math.max(0, dx * nx + dy * ny + dz * nz)
    const depth = Math.max(0, this.facePoint[1] - y)
    const heightFactor = 1 / (1 + this.verticalAttenuation * depth)
    const throwDistance = (this.maxThrow * heightFactor) / (1 + this.decay * distance * distance)
    return [nx * throwDistance, -throwDistance * this.verticalDrop, nz * throwDistance]
  }
}

export interface PerturbedFieldParams {
  base: VectorField
  prng: () => number
  sigma: number
}

/** Wraps a base field with additive Gaussian jitter. Deterministic for a given prng. */
export class PerturbedField implements VectorField {
  readonly kind = 'perturbed'
  readonly base: VectorField
  readonly prng: () => number
  readonly sigma: number
  private readonly noiseCache = new Map<string, Vec3>()

  constructor(params: PerturbedFieldParams) {
    this.base = params.base
    this.prng = params.prng
    this.sigma = params.sigma
  }

  sample(x: number, y: number, z: number): Vec3 {
    const base = this.base.sample(x, y, z)
    if (this.sigma === 0) return base

    // Cache by position so an ensemble member is a stable field rather than a
    // fresh random draw every frame. Cache order is identical across runs, so
    // seeded reproducibility is preserved.
    const key = `${x}|${y}|${z}`
    let noise = this.noiseCache.get(key)
    if (!noise) {
      const s = this.sigma
      noise = [normal(this.prng) * s, normal(this.prng) * s, normal(this.prng) * s]
      this.noiseCache.set(key, noise)
    }
    return [base[0] + noise[0], base[1] + noise[1], base[2] + noise[2]]
  }
}

function normalise(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2])
  if (length === 0) return [0, 0, 1]
  return [v[0] / length, v[1] / length, v[2] / length]
}

export interface BenchFieldConfig {
  kind: 'free-face' | 'uniform'
  maxThrow: number
  decay?: number
  uniformDx: number
  uniformDz: number
}

/** The free-face field used by the demo bench, with the two calibrated parameters exposed. */
export function benchFreeFaceField(
  model: BlockModel,
  maxThrow: number,
  decay: number,
): FreeFaceField {
  const bounds = modelBounds(model)
  return new FreeFaceField({
    facePoint: [(bounds.minX + bounds.maxX) / 2, bounds.maxY, bounds.minZ],
    faceNormal: [0, 0, 1],
    maxThrow,
    decay,
    verticalDrop: 0.18,
    verticalAttenuation: 0.06,
    lateralSpread: 0.12,
    spreadCenter: (bounds.minX + bounds.maxX) / 2,
  })
}

/** Builds the blast field for a bench. Shared by the renderer and the inspector. */
export function benchField(model: BlockModel, config: BenchFieldConfig): VectorField {
  if (config.kind === 'uniform') {
    return new UniformField({ dx: config.uniformDx, dz: config.uniformDz, dy: -1.5 })
  }
  return benchFreeFaceField(model, config.maxThrow, config.decay ?? 0.00012)
}
