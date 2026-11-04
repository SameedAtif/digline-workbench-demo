import type { StateCreator } from 'zustand'

import type { AppState, MetricsSlice } from '../types'

export const createMetricsSlice: StateCreator<AppState, [], [], MetricsSlice> = (set) => ({
  tonnes: 0,
  meanGrade: 0,
  dilution: 0,
  oreLoss: 0,
  setMetrics: (metrics) => set(metrics),
})
