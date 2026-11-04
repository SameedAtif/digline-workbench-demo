import Papa from 'papaparse'

import { createBlockModel, type BlockModel } from '@/domain'

import { blockRowSchema, REQUIRED_COLUMNS } from './schema'
import {
  DEFAULT_DENSITY,
  MAX_ROWS,
  type ParseErrorSummary,
  type ParseOptions,
  type ParseReason,
} from './protocol'

export type PureParseResult =
  { kind: 'ok'; model: BlockModel } | { kind: 'error'; summary: ParseErrorSummary }

function fail(total: number, rejected: number, reasons: ParseReason[]): PureParseResult {
  return { kind: 'error', summary: { total, rejected, reasons: reasons.slice(0, 5) } }
}

/**
 * Pure CSV parser. The worker delegates here so it can be unit-tested without a
 * Worker, and the main thread can use the same path as a fallback.
 */
export function parseCsvText(text: string, options: ParseOptions = {}): PureParseResult {
  const density = options.density ?? DEFAULT_DENSITY
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
  })

  const fields = parsed.meta.fields ?? []
  const missing = REQUIRED_COLUMNS.filter((column) => !fields.includes(column))
  if (missing.length > 0) {
    const reasons = missing.map((column) => ({ line: 1, reason: `missing header: ${column}` }))
    return fail(parsed.data.length, parsed.data.length, reasons)
  }

  if (parsed.data.length > MAX_ROWS) {
    return fail(parsed.data.length, parsed.data.length, [
      { line: 1, reason: `row count exceeds ${MAX_ROWS}` },
    ])
  }

  const count = parsed.data.length
  const x = new Float32Array(count)
  const y = new Float32Array(count)
  const z = new Float32Array(count)
  const size = new Float32Array(count)
  const grade = new Float32Array(count)
  const material = new Uint8Array(count)
  const tonnes = new Float32Array(count)

  const reasons: ParseReason[] = []
  let rejected = 0
  let written = 0

  parsed.data.forEach((row, index) => {
    const line = index + 2
    const result = blockRowSchema.safeParse(row)
    if (!result.success) {
      rejected += 1
      const issue = result.error.issues[0]
      const path = issue?.path.join('.') ?? 'row'
      reasons.push({ line, reason: `${path}: ${issue?.message ?? 'invalid row'}` })
      return
    }

    const value = result.data
    x[written] = value.x
    y[written] = value.y
    z[written] = value.z
    size[written] = value.size
    grade[written] = value.grade
    material[written] = value.material
    tonnes[written] = value.size ** 3 * density
    written += 1
  })

  if (rejected > 0) return fail(count, rejected, reasons)

  const model = createBlockModel({
    x: x.subarray(0, written),
    y: y.subarray(0, written),
    z: z.subarray(0, written),
    size: size.subarray(0, written),
    grade: grade.subarray(0, written),
    material: material.subarray(0, written),
    tonnes: tonnes.subarray(0, written),
  })

  return { kind: 'ok', model }
}
