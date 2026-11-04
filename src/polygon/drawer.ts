import { pointInFlatPolygon } from '@/domain'
import { useAppStore } from '@/state'

import { AddVertex, ClosePolygon, DeleteVertex, MovePolygon, MoveVertex } from './history'

export interface DrawerPorts {
  /** Screen coordinates → bench-plane coordinates (x, z). */
  raycastToPlane(clientX: number, clientY: number): [number, number] | null
  /** Screen coordinates → polygon vertex index, or null. */
  pickVertex(clientX: number, clientY: number): number | null
}

export interface Drawer {
  onPointerDown(event: PointerEvent): boolean
  onPointerMove(event: PointerEvent): void
  onPointerUp(event: PointerEvent): void
  onDoubleClick(event: MouseEvent): boolean
  dispose(): void
}

type Drag =
  | {
      kind: 'new'
      index: number
      startX: number
      startY: number
      moved: boolean
    }
  | {
      kind: 'vertex'
      index: number
      start: readonly [number, number]
      startX: number
      startY: number
      moved: boolean
    }
  | {
      kind: 'polygon'
      start: readonly [number, number]
      original: Float32Array
      startX: number
      startY: number
      moved: boolean
    }

export function createDrawer(canvas: HTMLCanvasElement, ports: DrawerPorts): Drawer {
  let drag: Drag | null = null
  let pointerId = -1

  const readVertex = (index: number): readonly [number, number] | null => {
    const { vertices } = useAppStore.getState()
    const x = vertices[index * 2]
    const z = vertices[index * 2 + 1]
    if (x === undefined || z === undefined) return null
    return [x, z]
  }

  const capture = (event: PointerEvent): void => {
    pointerId = event.pointerId
    canvas.setPointerCapture(event.pointerId)
  }

  const onPointerDown = (event: PointerEvent): boolean => {
    const store = useAppStore.getState()

    if (store.mode === 'placing') {
      const point = ports.raycastToPlane(event.clientX, event.clientY)
      if (!point) return false
      const index = store.vertices.length / 2
      store.appendVertexAt(point[0], point[1])
      drag = {
        kind: 'new',
        index,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      }
      capture(event)
      return true
    }

    if (store.mode === 'closed' || store.mode === 'editing') {
      const index = ports.pickVertex(event.clientX, event.clientY)
      if (index !== null) {
        const vertex = readVertex(index)
        if (!vertex) return false

        if (event.altKey) {
          const mode = store.mode
          store.executeCommand(DeleteVertex(index, vertex))
          if (mode === 'editing') useAppStore.getState().setMode('closed')
          return true
        }

        store.beginEditVertex(index)
        drag = {
          kind: 'vertex',
          index,
          start: vertex,
          startX: event.clientX,
          startY: event.clientY,
          moved: false,
        }
        capture(event)
        return true
      }

      // Drag the whole polygon when the press lands inside it.
      if (store.mode === 'closed') {
        const point = ports.raycastToPlane(event.clientX, event.clientY)
        if (point && pointInFlatPolygon(store.vertices, point[0], point[1])) {
          drag = {
            kind: 'polygon',
            start: point,
            original: new Float32Array(store.vertices),
            startX: event.clientX,
            startY: event.clientY,
            moved: false,
          }
          capture(event)
          return true
        }
      }
    }

    return false
  }

  const onPointerMove = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== pointerId) return
    if (Math.abs(event.clientX - drag.startX) > 2 || Math.abs(event.clientY - drag.startY) > 2) {
      drag.moved = true
    }
    const point = ports.raycastToPlane(event.clientX, event.clientY)
    if (!point) return
    const store = useAppStore.getState()

    if (drag.kind === 'new') {
      store.setVertexAt(drag.index, point[0], point[1])
      return
    }

    if (drag.kind === 'vertex') {
      store.moveVertex(drag.index, point[0], point[1])
      return
    }

    const dx = point[0] - drag.start[0]
    const dz = point[1] - drag.start[1]
    const moved = new Float32Array(drag.original)
    for (let i = 0; i < moved.length; i += 2) {
      moved[i] = (drag.original[i] ?? 0) + dx
      moved[i + 1] = (drag.original[i + 1] ?? 0) + dz
    }
    store.setVertices(moved)
  }

  const onPointerUp = (event: PointerEvent): void => {
    if (!drag || event.pointerId !== pointerId) return
    const store = useAppStore.getState()
    const active = drag

    if (active.kind === 'new') {
      const final = readVertex(active.index)
      store.removeVertexAt(active.index)
      if (final) store.executeCommand(AddVertex(final[0], final[1]))
    } else if (active.kind === 'vertex') {
      const finish = readVertex(active.index)
      store.endEditVertex()
      if (active.moved && finish) {
        store.recordCommand(MoveVertex(active.index, active.start, finish))
      }
    } else {
      const final = new Float32Array(store.vertices)
      if (active.moved) store.recordCommand(MovePolygon(active.original, final))
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
    drag = null
    pointerId = -1
  }

  const onDoubleClick = (event: MouseEvent): boolean => {
    const store = useAppStore.getState()
    if (store.mode !== 'placing') return false
    if (store.vertices.length / 2 < 3) return false
    event.preventDefault()
    store.executeCommand(ClosePolygon())
    return true
  }

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDoubleClick,
    dispose: () => {
      drag = null
      pointerId = -1
    },
  }
}
