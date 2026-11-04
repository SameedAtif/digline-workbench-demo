import type { StateCreator } from 'zustand'

import type { AppState, UISlice } from '../types'

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  colorMode: 'grade',
  cutoff: 0.9,
  gradeMax: 4,
  sliceEnabled: false,
  slicePosition: 0,
  fieldArrowsVisible: false,
  selectedBlock: null,
  statsVisible: true,
  hudVisible: false,
  setColorMode: (colorMode) => set({ colorMode }),
  setCutoff: (cutoff) => set({ cutoff: Math.max(0, cutoff) }),
  setGradeMax: (gradeMax) => set({ gradeMax: Math.max(0.0001, gradeMax) }),
  setSliceEnabled: (sliceEnabled) => set({ sliceEnabled }),
  setSlicePosition: (slicePosition) => set({ slicePosition }),
  setFieldArrowsVisible: (fieldArrowsVisible) => set({ fieldArrowsVisible }),
  setSelectedBlock: (selectedBlock) => set({ selectedBlock }),
  setStatsVisible: (statsVisible) => set({ statsVisible }),
  toggleHud: () => set((state) => ({ hudVisible: !state.hudVisible })),
})
