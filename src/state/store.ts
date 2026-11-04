import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

import type { AppState } from './types'
import { createBlastSlice } from './slices/blast.slice'
import { createCalibrationSlice } from './slices/calibration.slice'
import { createMetricsSlice } from './slices/metrics.slice'
import { createPolygonSlice } from './slices/polygon.slice'
import { createSceneSlice } from './slices/scene.slice'
import { createUISlice } from './slices/ui.slice'
import { createUncertaintySlice } from './slices/uncertainty.slice'

export const useAppStore = create<AppState>()((...args) => ({
  ...createSceneSlice(...args),
  ...createBlastSlice(...args),
  ...createPolygonSlice(...args),
  ...createUISlice(...args),
  ...createMetricsSlice(...args),
  ...createUncertaintySlice(...args),
  ...createCalibrationSlice(...args),
}))

/** Polygon-focused hook for components that only care about the draw tool. */
export function usePolygonStore<T>(selector: (state: AppState) => T): T {
  return useAppStore(selector)
}

export function useShallowApp<T>(selector: (state: AppState) => T): T {
  return useAppStore(useShallow(selector))
}

export const appStore = useAppStore
