import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  Plane,
  Raycaster,
  RingGeometry,
  Vector2,
  Vector3,
} from 'three'

import {
  applyField,
  baselineOre,
  benchField,
  createPolygon,
  DEFAULT_MONITOR_PARAMS,
  dilution,
  evaluateMonitors,
  generateMonitors,
  modelBounds,
  oreLoss,
  polygonMeanGrade,
  polygonTonnes,
  settleToMuckpile,
  type Baseline,
  type BlockModel,
  type Polygon,
  type VectorField,
} from '@/domain'
import { createDrawer, createKeyboardShortcuts, type Drawer } from '@/polygon'
import { createBlockField, type BlockField } from '@/render/blocks'
import type { Viewer } from '@/render/core'
import { createPicker, createSlicePlane, createTraceLine, type Picker } from '@/render/interaction'
import { createFieldArrows } from '@/render/field-arrows'
import { createMonitorLayer } from '@/render/monitor-layer'
import { createPolygonLayer } from '@/render/polygon'
import { createEnsembleBand } from '@/render/uncertainty'
import { useAppStore, type AppState } from '@/state'
import type { Bounds3 } from '@/types'
import { createEnsemble, type Ensemble } from '@/uncertainty'

export interface Workbench {
  dispose(): void
}

const PLAYBACK_SPEED = 0.6
const METRICS_HZ = 15

export function createWorkbench(viewer: Viewer): Workbench {
  const store = useAppStore
  const initial = store.getState()
  let model: BlockModel = initial.model
  let bounds: Bounds3 = modelBounds(model)
  let field: VectorField = benchField(model, toFieldConfig(initial))
  let postModel: BlockModel = computePostModel(model, field, initial.fieldKind)

  const blockField: { current: BlockField } = { current: createBlockField(model) }
  blockField.current.updatePostBlast(postModel)
  let picker: Picker = createPicker(viewer, blockField.current)
  let slicePlane = createSlicePlane({
    width: bounds.maxZ - bounds.minZ,
    height: bounds.maxY - bounds.minY,
    centerY: (bounds.minY + bounds.maxY) / 2,
    centerZ: (bounds.minZ + bounds.maxZ) / 2,
  })

  const polygonLayer = createPolygonLayer()
  const ensembleBand = createEnsembleBand()
  const traceLine = createTraceLine()
  const fieldArrows = createFieldArrows()
  fieldArrows.update(field, bounds)
  const monitorLayer = createMonitorLayer()

  const cursorGeometry = new RingGeometry(2.2, 3.4, 28)
  const cursorMaterial = new MeshBasicMaterial({
    color: 0x9be8dc,
    transparent: true,
    opacity: 0.95,
    side: DoubleSide,
    depthTest: false,
    depthWrite: false,
  })
  const cursorMarker = new Mesh(cursorGeometry, cursorMaterial)
  cursorMarker.rotation.x = -Math.PI / 2
  cursorMarker.visible = false
  cursorMarker.renderOrder = 8

  const previewGeometry = new BufferGeometry()
  previewGeometry.setAttribute('position', new Float32BufferAttribute(new Float32Array(6), 3))
  const previewMaterial = new LineBasicMaterial({
    color: 0x9be8dc,
    transparent: true,
    opacity: 0.7,
    depthTest: false,
    depthWrite: false,
  })
  const previewLine = new Line(previewGeometry, previewMaterial)
  previewLine.frustumCulled = false
  previewLine.visible = false
  previewLine.renderOrder = 7

  polygonLayer.setResolution(
    viewer.renderer.domElement.clientWidth || 800,
    viewer.renderer.domElement.clientHeight || 600,
  )

  viewer.add(blockField.current.object)
  viewer.add(polygonLayer.object)
  viewer.add(ensembleBand.object)
  viewer.add(slicePlane.object)
  viewer.add(traceLine.object)
  viewer.add(cursorMarker)
  viewer.add(previewLine)
  viewer.add(fieldArrows.object)
  viewer.add(monitorLayer.object)
  viewer.frame(bounds)

  if (initial.slicePosition === 0) {
    store.setState({ slicePosition: bounds.maxX })
  }

  const raycaster = new Raycaster()
  const ndc = new Vector2()
  const plane = new Plane(new Vector3(0, 1, 0), 0)
  const scratch = new Vector3()

  const toPlane = (clientX: number, clientY: number): [number, number] | null => {
    const rect = viewer.renderer.domElement.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(ndc, viewer.camera)
    const y = store.getState().planeY
    plane.set(new Vector3(0, 1, 0), -y)
    const point = raycaster.ray.intersectPlane(plane, scratch)
    if (!point) return null
    return [point.x, point.z]
  }

  const pickVertex = (clientX: number, clientY: number): number | null => {
    const state = store.getState()
    const n = state.vertices.length / 2
    if (n === 0) return null
    const rect = viewer.renderer.domElement.getBoundingClientRect()
    const polygon = createPolygon(state.vertices, state.planeY, true)
    let best = -1
    let bestDistance = 18

    for (let i = 0; i < n; i += 1) {
      const x0 = state.vertices[i * 2] ?? 0
      const z0 = state.vertices[i * 2 + 1] ?? 0
      const [dx, , dz] = field.sample(x0, polygon.planeY as number, z0)
      const x = x0 + state.t * dx
      const z = z0 + state.t * dz
      scratch.set(x, state.planeY as number, z).project(viewer.camera)
      const sx = rect.left + ((scratch.x + 1) / 2) * rect.width
      const sy = rect.top + ((1 - scratch.y) / 2) * rect.height
      const distance = Math.hypot(sx - clientX, sy - clientY)
      if (distance < bestDistance) {
        bestDistance = distance
        best = i
      }
    }

    return best >= 0 ? best : null
  }

  const drawer: Drawer = createDrawer(viewer.renderer.domElement, {
    raycastToPlane: toPlane,
    pickVertex,
  })
  const keyboard = createKeyboardShortcuts()

  let baseline: Baseline | null = null
  let baselineVertices: Float32Array | null = null
  let baselineModel: BlockModel | null = null
  let baselineCutoff = -1
  let baselinePlaneY = -1

  let ensemble: Ensemble = []
  let ensembleSignature = ''
  let lastT = -1
  let lastVertices: Float32Array | null = null
  let lastMode: AppState['mode'] | null = null
  let lastPlaneY = -1
  let lastField: VectorField | null = null

  const invalidateBaseline = (): void => {
    baseline = null
  }

  const ensureBaseline = (state: AppState): Baseline | null => {
    if (state.vertices.length / 2 < 3) return null
    if (
      baseline &&
      baselineVertices === state.vertices &&
      baselineModel === model &&
      baselineCutoff === state.cutoff &&
      baselinePlaneY === state.planeY
    ) {
      return baseline
    }
    const polygon = createPolygon(state.vertices, state.planeY, true)
    baseline = baselineOre(model, polygon, state.cutoff)
    baselineVertices = state.vertices
    baselineModel = model
    baselineCutoff = state.cutoff
    baselinePlaneY = state.planeY
    return baseline
  }

  const rebuildModel = (next: BlockModel): void => {
    viewer.remove(blockField.current.object)
    blockField.current.dispose()
    picker.dispose()

    model = next
    bounds = modelBounds(model)

    const nextField = createBlockField(model)
    blockField.current = nextField
    viewer.add(nextField.object)
    picker = createPicker(viewer, nextField)

    viewer.remove(slicePlane.object)
    slicePlane.dispose()
    slicePlane = createSlicePlane({
      width: bounds.maxZ - bounds.minZ,
      height: bounds.maxY - bounds.minY,
      centerY: (bounds.minY + bounds.maxY) / 2,
      centerZ: (bounds.minZ + bounds.maxZ) / 2,
    })
    viewer.add(slicePlane.object)

    viewer.frame(bounds)
    store.setState({ slicePosition: bounds.maxX })

    field = benchField(model, toFieldConfig(store.getState()))
    postModel = computePostModel(model, field, store.getState().fieldKind)
    nextField.updatePostBlast(postModel)
    fieldArrows.update(field, bounds)
    ensemble = []
    ensembleSignature = ''
    invalidateBaseline()
  }

  const rebuildField = (state: AppState): void => {
    field = benchField(model, toFieldConfig(state))
    postModel = computePostModel(model, field, state.fieldKind)
    blockField.current.updatePostBlast(postModel)
    fieldArrows.update(field, bounds)
    ensemble = []
    ensembleSignature = ''
    invalidateBaseline()
  }

  const sync = (state: AppState): void => {
    const previousT = lastT
    blockField.current.setT(state.t)
    blockField.current.setCutoff(state.cutoff)
    blockField.current.setGradeMax(state.gradeMax)
    blockField.current.setColorMode(state.colorMode)

    const clipEnabled = state.sliceEnabled
    blockField.current.setClipPlane(clipEnabled, { x: -1, y: 0, z: 0 }, state.slicePosition)
    slicePlane.setEnabled(clipEnabled)
    slicePlane.setPosition(state.slicePosition)
    fieldArrows.object.visible = state.fieldArrowsVisible
    if (state.mode !== 'placing') {
      cursorMarker.visible = false
      previewLine.visible = false
    }

    const polygonChanged =
      state.t !== previousT ||
      state.vertices !== lastVertices ||
      state.mode !== lastMode ||
      state.planeY !== lastPlaneY ||
      field !== lastField

    const closed = state.mode === 'closed' || state.mode === 'editing'
    const polygon: Polygon = createPolygon(state.vertices, state.planeY, closed)

    if (polygonChanged) {
      polygonLayer.update({
        polygon,
        field,
        t: state.t,
        showHandles: state.mode !== 'idle',
      })

      lastT = state.t
      lastVertices = state.vertices
      lastMode = state.mode
      lastPlaneY = state.planeY
      lastField = field
    }

    if (state.enabled) {
      const signature = `${state.size}|${state.sigma}|${state.seed}|${state.vertices.length}|${String(field.kind)}`
      if (signature !== ensembleSignature || ensemble.length === 0) {
        ensemble = createEnsemble({
          base: field,
          seed: state.seed,
          size: state.size,
          sigma: state.sigma,
        })
        ensembleSignature = signature
      }
      ensembleBand.object.visible = true
      ensembleBand.update({ polygon, ensemble, t: state.t })
    } else {
      ensembleBand.object.visible = false
    }

    const monitors = generateMonitors(model, { ...DEFAULT_MONITOR_PARAMS, seed: state.monitorSeed })
    monitorLayer.update(evaluateMonitors(monitors, field))
    monitorLayer.object.visible = state.monitorsEnabled

    traceLine.update(model, postModel, state.selectedBlock, state.t)
  }

  const updateMetrics = (): void => {
    const state = store.getState()
    const isClosed = state.mode === 'closed' || state.mode === 'editing'
    if (!isClosed || state.vertices.length / 2 < 3) {
      if (state.tonnes !== 0 || state.meanGrade !== 0) {
        state.setMetrics({ tonnes: 0, meanGrade: 0, dilution: 0, oreLoss: 0 })
      }
      return
    }

    const snapshot = ensureBaseline(state)
    if (!snapshot) return
    const polygon = createPolygon(state.vertices, state.planeY, true)
    const tonnes = polygonTonnes(model, polygon, field, state.t, state.cutoff)
    const meanGrade = polygonMeanGrade(model, polygon, field, state.t, state.cutoff)
    const dil = dilution(model, polygon, field, state.t, snapshot)
    const loss = oreLoss(model, polygon, field, state.t, snapshot)

    if (
      Math.abs(tonnes - state.tonnes) > 1e-6 ||
      Math.abs(meanGrade - state.meanGrade) > 1e-6 ||
      Math.abs(dil - state.dilution) > 1e-6 ||
      Math.abs(loss - state.oreLoss) > 1e-6
    ) {
      state.setMetrics({ tonnes, meanGrade, dilution: dil, oreLoss: loss })
    }
  }

  const unsubscribe = store.subscribe((state, previous) => {
    if (state.model !== previous.model) rebuildModel(state.model)
    if (
      state.fieldKind !== previous.fieldKind ||
      state.maxThrow !== previous.maxThrow ||
      state.uniformDx !== previous.uniformDx ||
      state.uniformDz !== previous.uniformDz ||
      state.model !== previous.model
    ) {
      rebuildField(state)
    }
    if (
      state.vertices !== previous.vertices ||
      state.planeY !== previous.planeY ||
      state.model !== previous.model
    ) {
      invalidateBaseline()
    }
    sync(state)
  })

  const canvas = viewer.renderer.domElement
  // Listen in the capture phase on the parent so drawing can take priority over
  // OrbitControls. Without this, a polygon drag also rotates the camera.
  const eventTarget = canvas.parentElement ?? canvas
  let downX = 0
  let downY = 0
  let consumed = false

  const onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return
    downX = event.clientX
    downY = event.clientY
    consumed = drawer.onPointerDown(event)
    if (consumed) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  const onPointerMove = (event: PointerEvent): void => {
    drawer.onPointerMove(event)
    if (consumed) event.stopPropagation()
    const state = store.getState()
    if (state.mode === 'placing') {
      const point = toPlane(event.clientX, event.clientY)
      if (point) {
        cursorMarker.position.set(point[0], state.planeY + 0.6, point[1])
        cursorMarker.visible = true

        const n = state.vertices.length / 2
        if (n >= 1) {
          const x0 = state.vertices[(n - 1) * 2] ?? 0
          const z0 = state.vertices[(n - 1) * 2 + 1] ?? 0
          const attribute = previewGeometry.getAttribute('position')
          const array = attribute.array as Float32Array
          array.set([x0, state.planeY + 0.6, z0, point[0], state.planeY + 0.6, point[1]])
          attribute.needsUpdate = true
          previewLine.visible = true
        }
      } else {
        cursorMarker.visible = false
        previewLine.visible = false
      }
    }
  }

  const onPointerUp = (event: PointerEvent): void => {
    drawer.onPointerUp(event)
    if (consumed) {
      event.stopPropagation()
      consumed = false
      return
    }
    const state = store.getState()
    if (state.mode === 'placing' || state.mode === 'editing') return
    const moved = Math.hypot(event.clientX - downX, event.clientY - downY)
    if (moved > 5) return
    const index = picker.pick(event.clientX, event.clientY)
    store.getState().setSelectedBlock(index)
  }

  const onDoubleClick = (event: MouseEvent): void => {
    if (drawer.onDoubleClick(event)) event.stopPropagation()
  }

  const onPointerLeave = (): void => {
    cursorMarker.visible = false
    previewLine.visible = false
  }

  const onResetView = (): void => viewer.frame(bounds)
  window.addEventListener('digline:reset-view', onResetView)

  eventTarget.addEventListener('pointerdown', onPointerDown, { capture: true })
  eventTarget.addEventListener('pointermove', onPointerMove, { capture: true })
  eventTarget.addEventListener('pointerup', onPointerUp, { capture: true })
  eventTarget.addEventListener('dblclick', onDoubleClick, { capture: true })
  eventTarget.addEventListener('pointerleave', onPointerLeave, { capture: true })

  const resizeUnsubscribe = viewer.onResize((width, height) => {
    polygonLayer.setResolution(width, height)
  })

  let metricsAccumulator = 0
  const frameUnsubscribe = viewer.onFrame(({ dt }) => {
    const state = store.getState()
    if (state.playing) {
      const next = state.t + dt * PLAYBACK_SPEED
      if (next >= 1) {
        state.setT(1)
        state.pause()
      } else {
        state.setT(next)
      }
    }

    metricsAccumulator += dt
    if (metricsAccumulator >= 1 / METRICS_HZ) {
      metricsAccumulator = 0
      updateMetrics()
    }
  })

  // Initial paint.
  sync(store.getState())
  updateMetrics()

  return {
    dispose: () => {
      unsubscribe()
      frameUnsubscribe()
      resizeUnsubscribe()
      window.removeEventListener('digline:reset-view', onResetView)
      eventTarget.removeEventListener('pointerdown', onPointerDown, { capture: true })
      eventTarget.removeEventListener('pointermove', onPointerMove, { capture: true })
      eventTarget.removeEventListener('pointerup', onPointerUp, { capture: true })
      eventTarget.removeEventListener('dblclick', onDoubleClick, { capture: true })
      eventTarget.removeEventListener('pointerleave', onPointerLeave, { capture: true })
      drawer.dispose()
      keyboard.dispose()
      picker.dispose()
      blockField.current.dispose()
      polygonLayer.dispose()
      ensembleBand.dispose()
      slicePlane.dispose()
      traceLine.dispose()
      cursorGeometry.dispose()
      cursorMaterial.dispose()
      previewGeometry.dispose()
      previewMaterial.dispose()
      fieldArrows.dispose()
      monitorLayer.dispose()
      viewer.remove(blockField.current.object)
      viewer.remove(polygonLayer.object)
      viewer.remove(ensembleBand.object)
      viewer.remove(slicePlane.object)
      viewer.remove(traceLine.object)
      viewer.remove(cursorMarker)
      viewer.remove(previewLine)
      viewer.remove(fieldArrows.object)
      viewer.remove(monitorLayer.object)
    },
  }
}

function computePostModel(model: BlockModel, field: VectorField, kind: string): BlockModel {
  const post = applyField(model, field, 1)
  if (kind !== 'free-face') return post
  return settleToMuckpile(model, post)
}

function toFieldConfig(state: AppState): {
  kind: AppState['fieldKind']
  maxThrow: number
  decay: number
  uniformDx: number
  uniformDz: number
} {
  return {
    kind: state.fieldKind,
    maxThrow: state.maxThrow,
    decay: state.decay,
    uniformDx: state.uniformDx,
    uniformDz: state.uniformDz,
  }
}
