import { useLayoutEffect, useRef, useState } from 'react'

import { describeImportError, parseCSV } from '@/data'

import { createViewer, type Viewer } from '@/render/core'
import { useAppStore } from '@/state'
import { createWorkbench } from '@/workbench'

import { HUD } from './HUD'
import { ViewerContext } from './viewer-context'

export function Viewport(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [dropMessage, setDropMessage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const mode = useAppStore((state) => state.mode)
  const t = useAppStore((state) => state.t)
  const vertexCount = useAppStore((state) => state.vertices.length / 2)

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const instance = createViewer({ canvas })
    const workbench = createWorkbench(instance)
    instance.start()
    setViewer(instance)
    if (import.meta.env.DEV) {
      ;(window as unknown as { __diglineViewer?: Viewer }).__diglineViewer = instance
      ;(window as unknown as { __diglineStore?: typeof useAppStore }).__diglineStore = useAppStore
    }

    return () => {
      workbench.dispose()
      instance.dispose()
    }
  }, [])

  const onDrop = async (event: React.DragEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (!file) return
    setDropMessage('Parsing CSV…')
    const result = await parseCSV(file)
    if (result.kind === 'ok') {
      useAppStore.getState().setModel(result.model)
      setDropMessage(`Loaded ${result.model.count.toLocaleString()} blocks`)
    } else {
      setDropMessage(describeImportError(result))
    }
    window.setTimeout(() => setDropMessage(null), 4000)
  }

  return (
    <div
      data-testid="viewport"
      className="relative h-full min-h-0 w-full overflow-hidden bg-[#0b0d10]"
      onDragOver={(event) => {
        event.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => void onDrop(event)}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none outline-none"
        style={{ cursor: mode === 'placing' ? 'crosshair' : 'grab' }}
      />
      {viewer ? (
        <ViewerContext.Provider value={viewer}>
          <HUD />
        </ViewerContext.Provider>
      ) : null}
      <div
        data-testid="viewport-guide"
        className="pointer-events-none absolute left-1/2 top-3 w-[min(560px,90%)] -translate-x-1/2 rounded-md border border-[#2b323c] bg-[#0b0d10]/85 px-3 py-2 text-center text-[11px] leading-5 text-[#b8c2cf] shadow-lg backdrop-blur"
      >
        {guideFor(mode, vertexCount, t)}
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-[#0b0d10]/70 px-3 py-1.5 text-[11px] text-[#7d8998] backdrop-blur">
        Drag to orbit · scroll to zoom · right-drag to pan · D toggles HUD · drop a CSV to import
      </div>
      {dragOver ? (
        <div className="pointer-events-none absolute inset-4 flex items-center justify-center rounded-lg border-2 border-dashed border-[#46b3a5] bg-[#46b3a5]/10 text-sm text-[#9be8dc]">
          Drop a block CSV to load it
        </div>
      ) : null}
      {dropMessage ? (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-md border border-[#2b323c] bg-[#0b0d10]/90 px-3 py-1.5 text-[11px] text-[#c3ccd7] shadow-lg">
          {dropMessage}
        </div>
      ) : null}
    </div>
  )
}

function guideFor(mode: string, vertexCount: number, t: number): string {
  if (mode === 'placing') {
    return vertexCount < 3
      ? `Drawing: click the bench top to place points (${vertexCount}/3 minimum).`
      : `Drawing: ${vertexCount} points placed. Click Close polygon in the left panel, or double-click the bench top.`
  }
  if (mode === 'editing') return 'Editing: drag a vertex handle. Alt-click a handle to delete it.'
  if (mode === 'closed') {
    return t > 0.01
      ? 'Polygon closed. Drag inside it to move it, drag a handle to reshape, click a block to trace, or toggle uncertainty.'
      : 'Polygon closed. Drag inside it to move it, or drag the Blast scrubber / press Play blast and read the metrics.'
  }
  return 'Start with Draw polygon in the left panel, then click the bench top to place ore-polygon corners.'
}
