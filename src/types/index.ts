declare const brand: unique symbol

/** Compile-time branding helper. Zero runtime cost. */
export type Brand<T, B extends string> = T & { readonly [brand]: B }

export type Vec3 = readonly [x: number, y: number, z: number]
export type Vec2 = readonly [x: number, z: number]

export interface Bounds2 {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface Bounds3 {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}
