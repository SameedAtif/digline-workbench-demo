import type { StateCreator } from 'zustand'

import type { AppState, BlastSlice } from '../types'

export const createBlastSlice: StateCreator<AppState, [], [], BlastSlice> = (set) => ({
  t: 0,
  playing: false,
  fieldKind: 'free-face',
  maxThrow: 24,
  decay: 0.00012,
  uniformDx: 10,
  uniformDz: 6,
  setT: (t) => set({ t: clamp(t) }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  resetBlast: () => set({ t: 0, playing: false }),
  setFieldKind: (fieldKind) => set({ fieldKind }),
  setMaxThrow: (maxThrow) => set({ maxThrow: Math.max(0, maxThrow) }),
  setDecay: (decay) => set({ decay: Math.max(0, decay) }),
  setUniform: (uniformDx, uniformDz) => set({ uniformDx, uniformDz }),
})

function clamp(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}
