import type { StateCreator } from 'zustand'

import type { AppState, CalibrationSlice } from '../types'

export const createCalibrationSlice: StateCreator<AppState, [], [], CalibrationSlice> = (set) => ({
  monitorsEnabled: true,
  monitorSeed: 4242,
  calibration: null,
  setMonitorsEnabled: (monitorsEnabled) => set({ monitorsEnabled }),
  setMonitorSeed: (monitorSeed) => set({ monitorSeed, calibration: null }),
  setCalibration: (calibration) => set({ calibration }),
})
