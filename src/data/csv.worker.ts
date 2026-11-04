import { parseCsvText } from './csv-parse'
import { MAX_FILE_BYTES, type ParseRequest, type ParseResponse } from './protocol'

interface WorkerScope {
  onmessage: ((event: MessageEvent<ParseRequest>) => void) | null
  postMessage: (message: ParseResponse, transfer?: Transferable[]) => void
}

const scope = self as unknown as WorkerScope

scope.onmessage = (event: MessageEvent<ParseRequest>) => {
  const request = event.data
  if (!request || request.kind !== 'parse') return

  void handle(request)
}

async function handle(request: ParseRequest): Promise<void> {
  try {
    if (request.file.size > MAX_FILE_BYTES) {
      scope.postMessage({
        kind: 'error',
        summary: {
          total: 0,
          rejected: 0,
          reasons: [{ line: 1, reason: 'file too large' }],
        },
        reason: 'file too large',
      })
      return
    }

    const text = await request.file.text()
    const result = parseCsvText(text, request.options ?? {})

    if (result.kind === 'error') {
      scope.postMessage({ kind: 'error', summary: result.summary })
      return
    }

    const { model } = result
    const transfer = [
      model.x.buffer,
      model.y.buffer,
      model.z.buffer,
      model.size.buffer,
      model.grade.buffer,
      model.material.buffer,
      model.tonnes.buffer,
    ] as Transferable[]

    scope.postMessage(
      {
        kind: 'ok',
        model: {
          x: model.x,
          y: model.y,
          z: model.z,
          size: model.size,
          grade: model.grade,
          material: model.material,
          tonnes: model.tonnes,
        },
      },
      transfer,
    )
  } catch (error) {
    scope.postMessage({
      kind: 'error',
      summary: {
        total: 0,
        rejected: 0,
        reasons: [{ line: 1, reason: error instanceof Error ? error.message : 'parse failed' }],
      },
      reason: 'parse failed',
    })
  }
}
