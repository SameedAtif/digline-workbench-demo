import type { BlockModelBuffers } from '@/domain'

export interface ParseOptions {
  density?: number
}

export interface ParseRequest {
  kind: 'parse'
  file: File
  options?: ParseOptions
}

export interface ParseReason {
  line: number
  reason: string
}

export interface ParseErrorSummary {
  total: number
  rejected: number
  reasons: ParseReason[]
}

export type SerialisedModel = BlockModelBuffers

export type ParseResponse =
  | { kind: 'ok'; model: SerialisedModel }
  | { kind: 'error'; summary: ParseErrorSummary; reason?: string }

export const MAX_FILE_BYTES = 250 * 1024 * 1024
export const MAX_ROWS = 2_000_000
export const DEFAULT_DENSITY = 2.7
