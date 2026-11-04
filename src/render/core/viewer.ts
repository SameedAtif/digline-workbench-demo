import {
  Color,
  GridHelper,
  AxesHelper,
  Scene,
  Texture,
  type Material,
  type Object3D,
  type PerspectiveCamera,
  type WebGLRenderer,
} from 'three'
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import type { Bounds3 } from '@/types'

import { createCamera, frameCameraToBounds } from './camera'
import { createControls } from './controls'
import { createLoop, type FrameCallback, type FrameInfo, type Loop } from './loop'
import { createRenderer } from './renderer'
import { observeResize, type ResizeController } from './resize'

export interface ViewerOptions {
  canvas: HTMLCanvasElement
  pixelRatio?: number
  antialias?: boolean
  devHelpers?: boolean
}

export type ResizeCallback = (width: number, height: number) => void

export interface Viewer {
  readonly scene: Scene
  readonly camera: PerspectiveCamera
  readonly renderer: WebGLRenderer
  readonly controls: OrbitControls
  add(object: Object3D): void
  remove(object: Object3D): void
  onFrame(callback: FrameCallback): () => void
  onResize(callback: ResizeCallback): () => void
  start(): void
  stop(): void
  resize(width: number, height: number): void
  frame(bounds: Bounds3): void
  dispose(): void
}

export function createViewer(options: ViewerOptions): Viewer {
  const scene = new Scene()
  scene.background = new Color(0x0b0d10)

  const camera = createCamera()
  const renderer = createRenderer({
    canvas: options.canvas,
    antialias: options.antialias ?? true,
    ...(options.pixelRatio === undefined ? {} : { pixelRatio: options.pixelRatio }),
  })
  const controls = createControls(camera, options.canvas)

  const frameCallbacks = new Set<FrameCallback>()
  const resizeCallbacks = new Set<ResizeCallback>()
  let disposed = false

  const render = (info: FrameInfo): void => {
    for (const callback of frameCallbacks) callback(info)
    controls.update()
    renderer.render(scene, camera)
  }

  const loop: Loop = createLoop(render)

  if (options.devHelpers) {
    const grid = new GridHelper(400, 80, 0x2b323c, 0x1b1f26)
    grid.position.y = -0.01
    const axes = new AxesHelper(30)
    scene.add(grid, axes)
  }

  const resizeObserver: ResizeController | null = options.canvas.parentElement
    ? observeResize(options.canvas.parentElement, (width, height) => viewer.resize(width, height))
    : null

  const initialWidth = options.canvas.clientWidth || 800
  const initialHeight = options.canvas.clientHeight || 600

  const viewer: Viewer = {
    scene,
    camera,
    renderer,
    controls,
    add: (object) => {
      scene.add(object)
    },
    remove: (object) => {
      scene.remove(object)
    },
    onFrame: (callback) => {
      frameCallbacks.add(callback)
      return () => frameCallbacks.delete(callback)
    },
    onResize: (callback) => {
      resizeCallbacks.add(callback)
      return () => resizeCallbacks.delete(callback)
    },
    start: () => loop.start(),
    stop: () => loop.stop(),
    resize: (width, height) => {
      if (disposed) return
      const w = Math.max(1, width)
      const h = Math.max(1, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      for (const callback of resizeCallbacks) callback(w, h)
    },
    frame: (bounds) => {
      frameCameraToBounds(camera, controls.target, bounds)
      controls.update()
    },
    dispose: () => {
      if (disposed) return
      disposed = true
      loop.stop()
      resizeObserver?.disconnect()
      controls.dispose()
      frameCallbacks.clear()
      resizeCallbacks.clear()

      scene.traverse((object: Object3D) => {
        const candidate = object as unknown as {
          geometry?: { dispose(): void }
          material?: Material | Material[]
        }
        candidate.geometry?.dispose()
        const material = candidate.material
        if (Array.isArray(material)) {
          material.forEach(disposeMaterial)
        } else if (material) {
          disposeMaterial(material)
        }
      })

      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }

  viewer.resize(initialWidth, initialHeight)

  return viewer
}

function disposeMaterial(material: Material): void {
  const record = material as unknown as Record<string, unknown>
  for (const value of Object.values(record)) {
    if (value instanceof Texture) value.dispose()
  }
  material.dispose()
}
