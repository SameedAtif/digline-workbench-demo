import type { Vec3 } from '@/types'

import { modelBounds, type BlockModel } from './block'
import { normal, mulberry32 } from './prng'
import { benchFreeFaceField } from './vector-field'
import type { VectorField } from './vector-field'

export interface MonitorPoint {
  readonly id: number
  readonly x: number
  readonly y: number
  readonly z: number
  readonly measured: Vec3
}

export interface MonitorResidual {
  readonly id: number
  readonly x: number
  readonly y: number
  readonly z: number
  readonly predicted: Vec3
  readonly measured: Vec3
  readonly residual: Vec3
  readonly magnitude: number
}

export interface MonitorEvaluation {
  readonly points: MonitorResidual[]
  readonly rms: number
  readonly max: number
}

export interface MonitorParams {
  seed: number
  count: number
  noiseSigma: number
  trueMaxThrow: number
  trueDecay: number
}

export const DEFAULT_MONITOR_PARAMS: MonitorParams = {
  seed: 4242,
  count: 16,
  noiseSigma: 0.7,
  trueMaxThrow: 18,
  trueDecay: 0.00004,
}

/**
 * Generates synthetic surface displacement monitors. "Measured" values come
 * from a hidden ground-truth field plus seeded noise, so calibration has
 * something real to recover.
 */
export function generateMonitors(
  model: BlockModel,
  params: MonitorParams = DEFAULT_MONITOR_PARAMS,
): MonitorPoint[] {
  const bounds = modelBounds(model)
  const planeY = bounds.maxY
  const width = bounds.maxX - bounds.minX
  const depth = bounds.maxZ - bounds.minZ
  const pad = Math.max(2, Math.min(width, depth) * 0.08)
  const cols = Math.max(2, Math.ceil(Math.sqrt(params.count)))
  const rows = Math.max(1, Math.ceil(params.count / cols))
  const trueField = benchFreeFaceField(model, params.trueMaxThrow, params.trueDecay)
  const prng = mulberry32(params.seed)

  const monitors: MonitorPoint[] = []
  for (let i = 0; i < params.count; i += 1) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const u = (col + 0.15 + 0.7 * prng()) / cols
    const v = (row + 0.15 + 0.7 * prng()) / rows
    const x = bounds.minX + pad + u * Math.max(1, width - pad * 2)
    const z = bounds.minZ + pad + v * Math.max(1, depth - pad * 2)
    const truth = trueField.sample(x, planeY, z)
    const measured: Vec3 = [
      truth[0] + normal(prng) * params.noiseSigma,
      truth[1] + normal(prng) * params.noiseSigma,
      truth[2] + normal(prng) * params.noiseSigma,
    ]
    monitors.push({ id: i, x, y: planeY, z, measured })
  }
  return monitors
}

/** Compares the active field against the stored measured displacements. */
export function evaluateMonitors(
  monitors: readonly MonitorPoint[],
  field: VectorField,
): MonitorEvaluation {
  const points: MonitorResidual[] = []
  let sumSq = 0
  let max = 0

  for (const monitor of monitors) {
    const predicted = field.sample(monitor.x, monitor.y, monitor.z)
    const residual: Vec3 = [
      monitor.measured[0] - predicted[0],
      monitor.measured[1] - predicted[1],
      monitor.measured[2] - predicted[2],
    ]
    const magnitude = Math.hypot(residual[0], residual[1], residual[2])
    sumSq += magnitude * magnitude
    max = Math.max(max, magnitude)
    points.push({
      id: monitor.id,
      x: monitor.x,
      y: monitor.y,
      z: monitor.z,
      predicted,
      measured: monitor.measured,
      residual,
      magnitude,
    })
  }

  const rms = points.length > 0 ? Math.sqrt(sumSq / points.length) : 0
  return { points, rms, max }
}

export interface CalibrationFit {
  maxThrow: number
  decay: number
  rms: number
}

/**
 * Deterministic coarse-to-fine search over the two free-face parameters.
 * It always returns a result; the caller decides whether to apply it.
 */
export function calibrateField(
  model: BlockModel,
  monitors: readonly MonitorPoint[],
): CalibrationFit {
  if (monitors.length === 0) return { maxThrow: 24, decay: 0.00012, rms: 0 }

  const rmsFor = (maxThrow: number, decay: number): number => {
    const field = benchFreeFaceField(model, maxThrow, decay)
    return evaluateMonitors(monitors, field).rms
  }

  let bestMaxThrow = 24
  let bestDecay = 0.00012
  let bestRms = Infinity

  for (let maxThrow = 6; maxThrow <= 36; maxThrow += 1) {
    for (let i = 0; i < 25; i += 1) {
      const t = i / 24
      const decay = Math.exp(Math.log(0.00001) + (Math.log(0.0005) - Math.log(0.00001)) * t)
      const rms = rmsFor(maxThrow, decay)
      if (rms < bestRms) {
        bestRms = rms
        bestMaxThrow = maxThrow
        bestDecay = decay
      }
    }
  }

  // Refine around the coarse winner.
  for (let dm = -1; dm <= 1; dm += 0.25) {
    const maxThrow = bestMaxThrow + dm
    for (let f = 0.75; f <= 1.25; f += 0.05) {
      const decay = bestDecay * f
      const rms = rmsFor(maxThrow, decay)
      if (rms < bestRms) {
        bestRms = rms
        bestMaxThrow = maxThrow
        bestDecay = decay
      }
    }
  }

  const maxThrow = Math.max(0, Math.round(bestMaxThrow * 2) / 2)
  const decay = Number(bestDecay.toPrecision(3))
  const rms = rmsFor(maxThrow, decay)

  return { maxThrow, decay, rms }
}
