import type { StateCreator } from 'zustand'

import type { AppState, UncertaintySlice } from '../types'

export const createUncertaintySlice: StateCreator<AppState, [], [], UncertaintySlice> = (set) => ({
  enabled: false,
  size: 10,
  sigma: 2.5,
  seed: 7,
  setEnabled: (enabled) => set({ enabled }),
  setSize: (size) => set({ size: Math.min(32, Math.max(1, Math.round(size))) }),
  setSigma: (sigma) => set({ sigma: Math.min(10, Math.max(0, sigma)) }),
})
