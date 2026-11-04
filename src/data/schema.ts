import { z } from 'zod'

export const REQUIRED_COLUMNS = ['x', 'y', 'z', 'size', 'grade', 'material'] as const

export const blockRowSchema = z.object({
  x: z.coerce.number().finite(),
  y: z.coerce.number().finite(),
  z: z.coerce.number().finite(),
  size: z.coerce.number().finite().positive(),
  grade: z.coerce.number().finite().nonnegative(),
  material: z.coerce.number().int().min(0).max(255),
})

export type BlockRow = z.infer<typeof blockRowSchema>
