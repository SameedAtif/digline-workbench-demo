import type { StateCreator } from 'zustand'

import { exampleOrePolygonVertices } from '@/domain'

import { initialModel, initialPlaneY } from './scene.slice'
import type { AppState, PolygonSlice } from '../types'

const HISTORY_LIMIT = 200

function count(vertices: Float32Array): number {
  return vertices.length / 2
}

function writeVertex(vertices: Float32Array, index: number, x: number, z: number): Float32Array {
  const next = new Float32Array(vertices)
  next[index * 2] = x
  next[index * 2 + 1] = z
  return next
}

function insertVertex(vertices: Float32Array, index: number, x: number, z: number): Float32Array {
  const next = new Float32Array(vertices.length + 2)
  next.set(vertices.subarray(0, index * 2), 0)
  next[index * 2] = x
  next[index * 2 + 1] = z
  next.set(vertices.subarray(index * 2), index * 2 + 2)
  return next
}

function removeVertex(vertices: Float32Array, index: number): Float32Array {
  const next = new Float32Array(vertices.length - 2)
  next.set(vertices.subarray(0, index * 2), 0)
  next.set(vertices.subarray(index * 2 + 2), index * 2)
  return next
}

const initialExample = exampleOrePolygonVertices(initialModel)

export const createPolygonSlice: StateCreator<AppState, [], [], PolygonSlice> = (set, get) => ({
  vertices: initialExample,
  planeY: initialPlaneY,
  mode: 'closed',
  editingVertex: null,
  historyStack: [],
  redoStack: [],

  startPlacing: (planeY) =>
    set({
      vertices: new Float32Array(0),
      planeY,
      mode: 'placing',
      editingVertex: null,
      historyStack: [],
      redoStack: [],
    }),

  addVertex: (x, z) => {
    if (get().mode !== 'placing') return
    set((state) => ({ vertices: insertVertex(state.vertices, count(state.vertices), x, z) }))
  },

  closePolygon: () => {
    if (count(get().vertices) >= 3) {
      set({ mode: 'closed', editingVertex: null })
    } else {
      set({ vertices: new Float32Array(0), mode: 'idle', editingVertex: null })
    }
  },

  cancel: () => {
    if (get().mode === 'closed') {
      set({ mode: 'idle', editingVertex: null })
    } else {
      set({ vertices: new Float32Array(0), mode: 'idle', editingVertex: null })
    }
  },

  beginEditVertex: (index) => {
    if (get().mode !== 'closed') return
    if (index < 0 || index >= count(get().vertices)) return
    set({ mode: 'editing', editingVertex: index })
  },

  moveVertex: (index, x, z) => {
    const state = get()
    if (state.mode !== 'editing' || state.editingVertex !== index) return
    if (index < 0 || index >= count(state.vertices)) return
    set({ vertices: writeVertex(state.vertices, index, x, z) })
  },

  endEditVertex: () => {
    if (get().mode !== 'editing') return
    set({ mode: 'closed', editingVertex: null })
  },

  deleteVertex: (index) => {
    const state = get()
    if (index < 0 || index >= count(state.vertices)) return
    const vertices = removeVertex(state.vertices, index)
    set({
      vertices,
      mode: count(vertices) < 3 ? 'placing' : state.mode === 'editing' ? 'closed' : state.mode,
      editingVertex: null,
    })
  },

  setVertexAt: (index, x, z) => {
    const state = get()
    if (index < 0 || index >= count(state.vertices)) return
    set({ vertices: writeVertex(state.vertices, index, x, z) })
  },

  appendVertexAt: (x, z) =>
    set((state) => ({ vertices: insertVertex(state.vertices, count(state.vertices), x, z) })),

  insertVertexAt: (index, x, z) => {
    const state = get()
    if (index < 0 || index > count(state.vertices)) return
    set({ vertices: insertVertex(state.vertices, index, x, z) })
  },

  removeVertexAt: (index) => {
    const state = get()
    if (index < 0 || index >= count(state.vertices)) return
    set({ vertices: removeVertex(state.vertices, index) })
  },

  removeLastVertex: () => {
    const state = get()
    if (state.vertices.length < 2) return
    set({ vertices: state.vertices.slice(0, state.vertices.length - 2) })
  },

  setMode: (mode) => set({ mode, editingVertex: null }),

  setVertices: (vertices) => set({ vertices }),

  clearPolygon: () =>
    set({
      vertices: new Float32Array(0),
      mode: 'idle',
      editingVertex: null,
      historyStack: [],
      redoStack: [],
    }),

  loadExamplePolygon: () => {
    const state = get()
    set({
      vertices: exampleOrePolygonVertices(state.model),
      mode: 'closed',
      editingVertex: null,
      planeY: state.planeY,
      historyStack: [],
      redoStack: [],
    })
  },

  executeCommand: (command) => {
    command.do()
    get().recordCommand(command)
  },

  recordCommand: (command) => {
    const state = get()
    const historyStack = [...state.historyStack, command]
    if (historyStack.length > HISTORY_LIMIT) historyStack.shift()
    set({ historyStack, redoStack: [] })
  },

  undo: () => {
    const state = get()
    const command = state.historyStack[state.historyStack.length - 1]
    if (!command) return
    command.undo()
    set({
      historyStack: state.historyStack.slice(0, -1),
      redoStack: [...state.redoStack, command],
    })
  },

  redo: () => {
    const state = get()
    const command = state.redoStack[state.redoStack.length - 1]
    if (!command) return
    command.do()
    set({
      redoStack: state.redoStack.slice(0, -1),
      historyStack: [...state.historyStack, command],
    })
  },
})
