import { createBlockModel, type BlockModel } from '@/domain'

import { parseCsvText } from './csv-parse'
import {
  MAX_FILE_BYTES,
  type ParseErrorSummary,
  type ParseOptions,
  type ParseResponse,
} from './protocol'

export interface ImportError {
  kind: 'error'
  reason: string
  summary?: ParseErrorSummary
}

export type ImportResult = { kind: 'ok'; model: BlockModel } | ImportError

let worker: Worker | null = null
let queue: Promise<unknown> = Promise.resolve()
const TIMEOUT_MS = 60_000

function spawnWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null
  if (worker) return worker
  try {
    worker = new Worker(new URL('./csv.worker.ts', import.meta.url), { type: 'module' })
    return worker
  } catch {
    return null
  }
}

function reconstruct(response: Extract<ParseResponse, { kind: 'ok' }>): ImportResult {
  const m = response.model
  const model = createBlockModel({
    x: m.x,
    y: m.y,
    z: m.z,
    size: m.size,
    grade: m.grade,
    material: m.material,
    tonnes: m.tonnes,
  })
  return { kind: 'ok', model }
}

async function parseWithWorker(
  file: File,
  options: ParseOptions,
  signal: AbortSignal | undefined,
): Promise<ImportResult> {
  const active = spawnWorker()
  if (!active) return parseInMainThread(file, options, signal)

  return new Promise<ImportResult>((resolve) => {
    let settled = false

    const finish = (result: ImportResult): void => {
      if (settled) return
      settled = true
      active.removeEventListener('message', onMessage)
      active.removeEventListener('error', onError)
      signal?.removeEventListener('abort', onAbort)
      clearTimeout(timer)
      resolve(result)
    }

    const onMessage = (event: MessageEvent<ParseResponse>): void => {
      const response = event.data
      if (response.kind === 'ok') {
        finish(reconstruct(response))
      } else {
        finish({
          kind: 'error',
          reason: response.reason ?? 'parse failed',
          summary: response.summary,
        })
      }
    }

    const onError = (event: ErrorEvent): void => {
      finish({ kind: 'error', reason: event.message || 'worker error' })
    }

    const onAbort = (): void => {
      finish({ kind: 'error', reason: 'aborted' })
    }

    const timer = setTimeout(() => {
      worker?.terminate()
      worker = null
      finish({ kind: 'error', reason: 'timeout' })
    }, TIMEOUT_MS)

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener('abort', onAbort)
    active.addEventListener('message', onMessage)
    active.addEventListener('error', onError)

    const request =
      options.density === undefined
        ? { kind: 'parse' as const, file }
        : { kind: 'parse' as const, file, options }
    active.postMessage(request)
  })
}

async function parseInMainThread(
  file: File,
  options: ParseOptions,
  signal: AbortSignal | undefined,
): Promise<ImportResult> {
  if (signal?.aborted) return { kind: 'error', reason: 'aborted' }
  try {
    const text = await file.text()
    if (signal?.aborted) return { kind: 'error', reason: 'aborted' }
    const result = parseCsvText(text, options)
    if (result.kind === 'error') {
      return { kind: 'error', reason: 'invalid csv', summary: result.summary }
    }
    return { kind: 'ok', model: result.model }
  } catch (error) {
    return { kind: 'error', reason: error instanceof Error ? error.message : 'parse failed' }
  }
}

/**
 * Main-thread facade over the parser worker. Lazy singleton, AbortSignal aware,
 * and fail-closed: it never throws across the boundary.
 */
export function parseCSV(
  file: File,
  options: ParseOptions = {},
  signal?: AbortSignal,
): Promise<ImportResult> {
  if (file.size > MAX_FILE_BYTES) {
    return Promise.resolve({ kind: 'error', reason: 'file too large' })
  }

  const run = queue.then(() => parseWithWorker(file, options, signal))
  queue = run.catch(() => undefined)
  return run
}

export function disposeImporter(): void {
  worker?.terminate()
  worker = null
}

/** Human-readable one-liner for a failed import. */
export function describeImportError(result: ImportError): string {
  const first = result.summary?.reasons[0]
  if (first) return `${result.reason}: ${first.reason} (line ${first.line})`
  return result.reason
}
