import type { StateCreator } from 'zustand'

import { defaultBenchParams, generateBench } from '@/data'
import { modelBounds, type BlockModel } from '@/domain'

import type { AppState, SceneSlice } from '../types'

function initialParams(): ReturnType<typeof defaultBenchParams> {
  const defaults = defaultBenchParams()
  if (typeof window === 'undefined') return defaults
  const url = new URLSearchParams(window.location.search)
  const seed = numberParam(url, 'seed', defaults.seed)
  return {
    ...defaults,
    seed,
    nx: numberParam(url, 'nx', defaults.nx),
    ny: numberParam(url, 'ny', defaults.ny),
    nz: numberParam(url, 'nz', defaults.nz),
  }
}

function numberParam(url: URLSearchParams, key: string, fallback: number): number {
  const raw = url.get(key)
  if (raw === null) return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

export const initialModel = generateBench(initialParams())
const initialBounds = modelBounds(initialModel)

export const initialPlaneY = initialBounds.maxY

export const createSceneSlice: StateCreator<AppState, [], [], SceneSlice> = (set) => ({
  model: initialModel as BlockModel,
  setModel: (model) => {
    const bounds = modelBounds(model)
    set({
      model,
      vertices: new Float32Array(0),
      mode: 'idle',
      editingVertex: null,
      planeY: bounds.maxY,
      historyStack: [],
      redoStack: [],
      selectedBlock: null,
      calibration: null,
      t: 0,
      playing: false,
    })
  },
})
