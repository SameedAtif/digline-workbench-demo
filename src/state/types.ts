import type { BlockModel } from '@/domain'

export type ColorMode = 'grade' | 'material' | 'neutral'
export type FieldKind = 'free-face' | 'uniform'
export type PolygonMode = 'idle' | 'placing' | 'closed' | 'editing'

export interface PolygonCommand {
  readonly label: string
  do(): void
  undo(): void
}

export interface SceneSlice {
  model: BlockModel
  setModel(model: BlockModel): void
}

export interface BlastSlice {
  t: number
  playing: boolean
  fieldKind: FieldKind
  maxThrow: number
  decay: number
  uniformDx: number
  uniformDz: number
  setT(t: number): void
  play(): void
  pause(): void
  resetBlast(): void
  setFieldKind(kind: FieldKind): void
  setMaxThrow(value: number): void
  setDecay(value: number): void
  setUniform(dx: number, dz: number): void
}

export interface PolygonSlice {
  vertices: Float32Array
  planeY: number
  mode: PolygonMode
  editingVertex: number | null
  historyStack: PolygonCommand[]
  redoStack: PolygonCommand[]
  startPlacing(planeY: number): void
  addVertex(x: number, z: number): void
  closePolygon(): void
  cancel(): void
  beginEditVertex(index: number): void
  moveVertex(index: number, x: number, z: number): void
  endEditVertex(): void
  deleteVertex(index: number): void
  setVertexAt(index: number, x: number, z: number): void
  appendVertexAt(x: number, z: number): void
  insertVertexAt(index: number, x: number, z: number): void
  removeVertexAt(index: number): void
  removeLastVertex(): void
  setMode(mode: PolygonMode): void
  setVertices(vertices: Float32Array): void
  clearPolygon(): void
  loadExamplePolygon(): void
  executeCommand(command: PolygonCommand): void
  recordCommand(command: PolygonCommand): void
  undo(): void
  redo(): void
}

export interface UISlice {
  colorMode: ColorMode
  cutoff: number
  gradeMax: number
  sliceEnabled: boolean
  slicePosition: number
  fieldArrowsVisible: boolean
  selectedBlock: number | null
  statsVisible: boolean
  hudVisible: boolean
  setColorMode(mode: ColorMode): void
  setCutoff(value: number): void
  setGradeMax(value: number): void
  setSliceEnabled(value: boolean): void
  setSlicePosition(value: number): void
  setFieldArrowsVisible(value: boolean): void
  setSelectedBlock(index: number | null): void
  setStatsVisible(value: boolean): void
  toggleHud(): void
}

export interface MetricsSlice {
  tonnes: number
  meanGrade: number
  dilution: number
  oreLoss: number
  setMetrics(metrics: {
    tonnes: number
    meanGrade: number
    dilution: number
    oreLoss: number
  }): void
}

export interface CalibrationResult {
  beforeRms: number
  afterRms: number
  maxThrow: number
  decay: number
  sigma: number
}

export interface CalibrationSlice {
  monitorsEnabled: boolean
  monitorSeed: number
  calibration: CalibrationResult | null
  setMonitorsEnabled(value: boolean): void
  setMonitorSeed(value: number): void
  setCalibration(value: CalibrationResult | null): void
}

export interface UncertaintySlice {
  enabled: boolean
  size: number
  sigma: number
  seed: number
  setEnabled(value: boolean): void
  setSize(value: number): void
  setSigma(value: number): void
}

export type AppState = SceneSlice &
  BlastSlice &
  PolygonSlice &
  UISlice &
  MetricsSlice &
  UncertaintySlice &
  CalibrationSlice
