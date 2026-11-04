import { useAppStore } from '@/state'
import type { PolygonCommand } from '@/state/types'

type Vertex = readonly [x: number, z: number]

class AddVertexCommand implements PolygonCommand {
  readonly label = 'Add vertex'
  constructor(private readonly point: Vertex) {}

  do(): void {
    useAppStore.getState().appendVertexAt(this.point[0], this.point[1])
  }

  undo(): void {
    useAppStore.getState().removeLastVertex()
  }
}

class MoveVertexCommand implements PolygonCommand {
  readonly label = 'Move vertex'
  constructor(
    private readonly index: number,
    private readonly from: Vertex,
    private readonly to: Vertex,
  ) {}

  do(): void {
    useAppStore.getState().setVertexAt(this.index, this.to[0], this.to[1])
  }

  undo(): void {
    useAppStore.getState().setVertexAt(this.index, this.from[0], this.from[1])
  }
}

class DeleteVertexCommand implements PolygonCommand {
  readonly label = 'Delete vertex'
  constructor(
    private readonly index: number,
    private readonly value: Vertex,
  ) {}

  do(): void {
    useAppStore.getState().removeVertexAt(this.index)
  }

  undo(): void {
    useAppStore.getState().insertVertexAt(this.index, this.value[0], this.value[1])
  }
}

class MovePolygonCommand implements PolygonCommand {
  readonly label = 'Move polygon'
  constructor(
    private readonly before: Float32Array,
    private readonly after: Float32Array,
  ) {}

  do(): void {
    useAppStore.getState().setVertices(new Float32Array(this.after))
  }

  undo(): void {
    useAppStore.getState().setVertices(new Float32Array(this.before))
  }
}

class ClosePolygonCommand implements PolygonCommand {
  readonly label = 'Close polygon'

  do(): void {
    useAppStore.getState().setMode('closed')
  }

  undo(): void {
    useAppStore.getState().setMode('placing')
  }
}

export const AddVertex = (x: number, z: number): PolygonCommand => new AddVertexCommand([x, z])
export const MoveVertex = (index: number, from: Vertex, to: Vertex): PolygonCommand =>
  new MoveVertexCommand(index, from, to)
export const DeleteVertex = (index: number, value: Vertex): PolygonCommand =>
  new DeleteVertexCommand(index, value)
export const MovePolygon = (before: Float32Array, after: Float32Array): PolygonCommand =>
  new MovePolygonCommand(before, after)
export const ClosePolygon = (): PolygonCommand => new ClosePolygonCommand()
