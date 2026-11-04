import type { Brand } from '@/types'

export type Metres = Brand<number, 'Metres'>
export type Tonnes = Brand<number, 'Tonnes'>
export type GramsPerTonne = Brand<number, 'GramsPerTonne'>
export type Density = Brand<number, 'Density'>
export type MaterialId = Brand<number, 'MaterialId'>

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number, received ${String(value)}`)
  }
  return value
}

export const metres = (value: number): Metres => finite(value, 'metres') as Metres
export const tonnes = (value: number): Tonnes => finite(value, 'tonnes') as Tonnes
export const gramsPerTonne = (value: number): GramsPerTonne =>
  finite(value, 'gramsPerTonne') as GramsPerTonne
export const density = (value: number): Density => finite(value, 'density') as Density
export const materialId = (value: number): MaterialId => {
  const v = finite(value, 'materialId')
  if (!Number.isInteger(v) || v < 0 || v > 255) {
    throw new RangeError(`materialId must be an integer in [0, 255], received ${v}`)
  }
  return v as MaterialId
}

export const MATERIAL = {
  waste: 0,
  ore: 1,
  lowGrade: 2,
} as const

export type MaterialKind = keyof typeof MATERIAL
