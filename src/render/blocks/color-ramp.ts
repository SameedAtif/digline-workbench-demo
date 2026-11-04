import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
} from 'three'

export type RampName = 'viridis' | 'magma' | 'neutral'

type RGB = readonly [number, number, number]

const VIRIDIS: readonly RGB[] = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [253, 231, 37],
]

const MAGMA: readonly RGB[] = [
  [0, 0, 4],
  [28, 16, 68],
  [79, 18, 123],
  [129, 37, 129],
  [181, 54, 122],
  [229, 80, 100],
  [251, 135, 97],
  [254, 194, 135],
  [252, 253, 191],
]

const NEUTRAL: readonly RGB[] = [
  [34, 38, 46],
  [80, 88, 99],
  [140, 150, 163],
  [210, 218, 228],
]

const RAMP_SIZE = 256

function sampleRamp(stops: readonly RGB[], t: number): RGB {
  const scaled = t * (stops.length - 1)
  const lower = Math.floor(scaled)
  const upper = Math.min(stops.length - 1, lower + 1)
  const a = stops[lower] ?? [0, 0, 0]
  const b = stops[upper] ?? a
  const k = scaled - lower
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

export function makeRamp(name: RampName): DataTexture {
  const stops = name === 'magma' ? MAGMA : name === 'neutral' ? NEUTRAL : VIRIDIS
  const data = new Uint8Array(RAMP_SIZE * 4)
  for (let i = 0; i < RAMP_SIZE; i += 1) {
    const [r, g, b] = sampleRamp(stops, i / (RAMP_SIZE - 1))
    data[i * 4] = Math.round(r)
    data[i * 4 + 1] = Math.round(g)
    data[i * 4 + 2] = Math.round(b)
    data[i * 4 + 3] = 255
  }

  const texture = new DataTexture(data, RAMP_SIZE, 1, RGBAFormat, UnsignedByteType)
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.generateMipmaps = false
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/** Returns the raw RGBA bytes. Used by the legend and by tests. */
export function rampBytes(name: RampName): Uint8Array {
  const texture = makeRamp(name)
  const bytes = new Uint8Array(texture.image.data as Uint8Array)
  texture.dispose()
  return bytes
}
