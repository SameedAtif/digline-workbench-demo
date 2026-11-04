import { modelBounds, type BlockModel } from './block'

export interface MuckpileParams {
  groundY?: number
  height?: number
  centerX?: number
  centerZ?: number
  radiusX?: number
  radiusZ?: number
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function hash01(value: number): number {
  const x = Math.sin(value * 127.1 + 311.7) * 43758.5453123
  return x - Math.floor(x)
}

/**
 * Deterministic settle pass. It shapes the post-blast block heights into a
 * mounded pile without a rigid-body solver: the final plan position decides
 * the local pile height, and each block's original layer plus a stable hash
 * decides where it sits inside that height.
 *
 * Mutates and returns `post` (which is already a clone from `applyField`).
 */
export function settleToMuckpile(
  original: BlockModel,
  post: BlockModel,
  params: MuckpileParams = {},
): BlockModel {
  const bounds = modelBounds(original)
  const groundY = params.groundY ?? bounds.minY
  const height = Math.max(1e-6, params.height ?? bounds.maxY - bounds.minY)
  const centerX = params.centerX ?? (bounds.minX + bounds.maxX) / 2
  const centerZ = params.centerZ ?? (bounds.minZ + bounds.maxZ) / 2
  const radiusX = Math.max(1e-6, params.radiusX ?? (bounds.maxX - bounds.minX) * 0.55)
  const radiusZ = Math.max(1e-6, params.radiusZ ?? (bounds.maxZ - bounds.minZ) * 0.55)
  const layerHeight = Math.max(1e-6, height)
  const originalMinY = bounds.minY

  for (let i = 0; i < post.count; i += 1) {
    const size = post.size[i] ?? 4
    const half = size * 0.5
    const origY = original.y[i] ?? originalMinY
    const layerFraction = clamp01((origY - originalMinY) / layerHeight)

    const x = post.x[i] ?? centerX
    const z = post.z[i] ?? centerZ
    const nx = (x - centerX) / radiusX
    const nz = (z - centerZ) / radiusZ
    const mound = Math.exp(-0.5 * (nx * nx * 1.15 + nz * nz * 1.05))

    const pileHeight = Math.max(size * 1.2, height * (0.28 + 0.72 * mound))
    const jitter = hash01(i * 1.61803398875 + 0.37)
    const fraction = clamp01(layerFraction * 0.55 + jitter * 0.45)
    post.y[i] = groundY + half + fraction * Math.max(0, pileHeight - size)
  }

  return post
}
