import type { Vec3 } from '@/types'
import { createBlockModel, MATERIAL, mulberry32, normal, type BlockModel } from '@/domain'

export type FaceAxis = 'x' | '-x' | 'z' | '-z'

export interface BenchParams {
  seed: number
  nx: number
  ny: number
  nz: number
  cellSize: number
  meanGrade: number
  cutoff: number
  density: number
  faceAxis: FaceAxis
  orebodyCenter?: Vec3
  orebodyRadius?: number
  gradeSigma?: number
}

const DEFAULT_SEED = 20260214

export function defaultBenchParams(seed: number = DEFAULT_SEED): Required<BenchParams> {
  const nx = 48
  const ny = 5
  const nz = 48
  const cellSize = 4
  return {
    seed,
    nx,
    ny,
    nz,
    cellSize,
    meanGrade: 1.8,
    cutoff: 0.9,
    density: 2.7,
    faceAxis: 'z',
    orebodyCenter: [(nx * cellSize) / 2, (ny * cellSize) / 2, (nz * cellSize) / 2],
    orebodyRadius: Math.min(nx, nz) * cellSize * 0.42,
    gradeSigma: 0.65,
  }
}

/**
 * Deterministic synthetic open-pit bench. Same seed and parameters produce
 * byte-identical buffers.
 */
export function generateBench(params: BenchParams): BlockModel {
  const { seed, nx, ny, nz, cellSize, meanGrade, cutoff, density, gradeSigma = 0.65 } = params
  const center: Vec3 = params.orebodyCenter ?? [
    (nx * cellSize) / 2,
    (ny * cellSize) / 2,
    (nz * cellSize) / 2,
  ]
  const radius = params.orebodyRadius ?? Math.min(nx, nz) * cellSize * 0.42

  const count = nx * ny * nz
  if (count <= 0) throw new RangeError('bench dimensions must be positive')

  const x = new Float32Array(count)
  const y = new Float32Array(count)
  const z = new Float32Array(count)
  const size = new Float32Array(count)
  const grade = new Float32Array(count)
  const material = new Uint8Array(count)
  const tonnes = new Float32Array(count)

  const prng = mulberry32(seed)
  const blockTonnes = cellSize ** 3 * density

  let rawSum = 0
  let i = 0
  for (let iy = 0; iy < ny; iy += 1) {
    for (let iz = 0; iz < nz; iz += 1) {
      for (let ix = 0; ix < nx; ix += 1) {
        const px = (ix + 0.5) * cellSize
        const py = (iy + 0.5) * cellSize
        const pz = (iz + 0.5) * cellSize

        const dx = px - center[0]
        const dy = py - center[1]
        const dz = pz - center[2]
        const distanceSq = dx * dx + dy * dy + dz * dz
        const falloff = Math.exp(-distanceSq / (2 * radius * radius))

        const lognormal = Math.exp(gradeSigma * normal(prng) - 0.5 * gradeSigma ** 2)
        const raw = Math.max(0, lognormal * (0.12 + 0.88 * falloff))

        x[i] = px
        y[i] = py
        z[i] = pz
        size[i] = cellSize
        grade[i] = raw
        tonnes[i] = blockTonnes
        rawSum += raw
        i += 1
      }
    }
  }

  // Normalise the field so the bench's overall mean grade matches the request.
  const scale = rawSum > 0 ? meanGrade / (rawSum / count) : 0
  for (let k = 0; k < count; k += 1) {
    const g = Math.max(0, (grade[k] ?? 0) * scale)
    grade[k] = g
    material[k] =
      g >= cutoff ? MATERIAL.ore : g >= cutoff * 0.8 ? MATERIAL.lowGrade : MATERIAL.waste
  }

  return createBlockModel({ x, y, z, size, grade, material, tonnes })
}

/** Serialises a model to the importer's expected CSV shape. Useful for round-trip tests. */
export function benchToCsv(model: BlockModel): string {
  const lines: string[] = ['x,y,z,size,grade,material']
  for (let i = 0; i < model.count; i += 1) {
    lines.push(
      [
        model.x[i] ?? 0,
        model.y[i] ?? 0,
        model.z[i] ?? 0,
        model.size[i] ?? 0,
        model.grade[i] ?? 0,
        model.material[i] ?? 0,
      ].join(','),
    )
  }
  return lines.join('\n')
}
