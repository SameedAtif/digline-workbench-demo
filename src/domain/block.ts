export interface BlockModel {
  readonly count: number
  readonly x: Float32Array
  readonly y: Float32Array
  readonly z: Float32Array
  readonly size: Float32Array
  readonly grade: Float32Array
  readonly material: Uint8Array
  readonly tonnes: Float32Array
}

export interface BlockModelBuffers {
  x: Float32Array
  y: Float32Array
  z: Float32Array
  size: Float32Array
  grade: Float32Array
  material: Uint8Array
  tonnes: Float32Array
}

function assertFinite(values: Float32Array, name: string): void {
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i]
    if (value === undefined || !Number.isFinite(value)) {
      throw new TypeError(`block model field "${name}" contains a non-finite value at ${i}`)
    }
  }
}

/**
 * Smart constructor: validates invariants once, then downstream code trusts the type.
 */
export function createBlockModel(buffers: BlockModelBuffers): BlockModel {
  const count = buffers.x.length
  const fields: Array<[string, ArrayLike<number>]> = [
    ['y', buffers.y],
    ['z', buffers.z],
    ['size', buffers.size],
    ['grade', buffers.grade],
    ['material', buffers.material],
    ['tonnes', buffers.tonnes],
  ]

  for (const [name, field] of fields) {
    if (field.length !== count) {
      throw new RangeError(
        `block model fields must have equal length; x has ${count}, ${name} has ${field.length}`,
      )
    }
  }

  assertFinite(buffers.x, 'x')
  assertFinite(buffers.y, 'y')
  assertFinite(buffers.z, 'z')
  assertFinite(buffers.size, 'size')
  assertFinite(buffers.grade, 'grade')
  assertFinite(buffers.tonnes, 'tonnes')

  for (let i = 0; i < buffers.material.length; i += 1) {
    const material = buffers.material[i]
    if (material === undefined || !Number.isInteger(material) || material < 0 || material > 255) {
      throw new RangeError(`block model material id at ${i} must be an integer in [0, 255]`)
    }
  }

  return {
    count,
    x: buffers.x,
    y: buffers.y,
    z: buffers.z,
    size: buffers.size,
    grade: buffers.grade,
    material: buffers.material,
    tonnes: buffers.tonnes,
  }
}

/** Structural clone with independent buffers. Used by transforms. */
export function cloneBlockModel(model: BlockModel): BlockModel {
  return {
    count: model.count,
    x: new Float32Array(model.x),
    y: new Float32Array(model.y),
    z: new Float32Array(model.z),
    size: new Float32Array(model.size),
    grade: new Float32Array(model.grade),
    material: new Uint8Array(model.material),
    tonnes: new Float32Array(model.tonnes),
  }
}

export function modelBounds(model: BlockModel): {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
} {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let minZ = Infinity
  let maxZ = -Infinity

  for (let i = 0; i < model.count; i += 1) {
    const x = model.x[i] ?? 0
    const y = model.y[i] ?? 0
    const z = model.z[i] ?? 0
    const half = (model.size[i] ?? 0) * 0.5
    minX = Math.min(minX, x - half)
    maxX = Math.max(maxX, x + half)
    minY = Math.min(minY, y - half)
    maxY = Math.max(maxY, y + half)
    minZ = Math.min(minZ, z - half)
    maxZ = Math.max(maxZ, z + half)
  }

  return { minX, maxX, minY, maxY, minZ, maxZ }
}
