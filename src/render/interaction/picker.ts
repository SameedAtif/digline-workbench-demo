import {
  Color,
  GLSL3,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderTarget,
  type Material,
  type Object3D,
  type Scene,
} from 'three'

import type { Viewer } from '@/render/core'
import type { BlockField } from '@/render/blocks'

import pickingFragment from './picking.frag.glsl'
import pickingVertex from './picking.vert.glsl'

export interface Picker {
  pick(clientX: number, clientY: number): number | null
  dispose(): void
}

export function encodeIndex(index: number): [number, number, number] {
  const id = index + 1
  return [id & 0xff, (id >> 8) & 0xff, (id >> 16) & 0xff]
}

export function decodeIndex(r: number, g: number, b: number): number | null {
  const id = r + g * 256 + b * 65536
  return id === 0 ? null : id - 1
}

export function createPicker(viewer: Viewer, blockField: BlockField): Picker {
  const target = new WebGLRenderTarget(1, 1)
  const pixel = new Uint8Array(4)
  const size = new Vector2()
  const uniforms = { uT: { value: 0 } }
  const material = new ShaderMaterial({
    vertexShader: pickingVertex,
    fragmentShader: pickingFragment,
    glslVersion: GLSL3,
    uniforms,
  })

  let disposed = false

  const pick = (clientX: number, clientY: number): number | null => {
    if (disposed) return null
    const { renderer, camera, scene } = viewer
    const canvas = renderer.domElement
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return null

    renderer.getDrawingBufferSize(size)
    const scaleX = size.x / rect.width
    const scaleY = size.y / rect.height
    const px = Math.max(0, Math.min(size.x - 1, Math.floor((clientX - rect.left) * scaleX)))
    const py = Math.max(0, Math.min(size.y - 1, Math.floor((rect.bottom - clientY) * scaleY)))

    const previousTarget = renderer.getRenderTarget()
    const previousViewport = renderer.getViewport(new Vector4())
    const previousScissor = renderer.getScissor(new Vector4())
    const previousScissorTest = renderer.getScissorTest()
    const previousClear = renderer.getClearColor(new Color())
    const previousClearAlpha = renderer.getClearAlpha()
    const previousT = uniforms.uT.value

    const hidden = hideNonBlockObjects(scene, blockField.object)
    const previousMaterial: Material = blockField.mesh.material as Material
    blockField.mesh.material = material
    uniforms.uT.value = blockField.uniforms.uT.value

    try {
      renderer.setClearColor(0x000000, 1)
      renderer.setRenderTarget(target)
      renderer.setScissorTest(true)
      renderer.setViewport(0, 0, 1, 1)
      renderer.setScissor(0, 0, 1, 1)
      camera.setViewOffset(size.x, size.y, px, py, 1, 1)
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
      renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixel)
      return decodeIndex(pixel[0] ?? 0, pixel[1] ?? 0, pixel[2] ?? 0)
    } finally {
      blockField.mesh.material = previousMaterial
      uniforms.uT.value = previousT
      camera.clearViewOffset()
      camera.updateProjectionMatrix()
      renderer.setRenderTarget(previousTarget)
      renderer.setViewport(previousViewport)
      renderer.setScissor(previousScissor)
      renderer.setScissorTest(previousScissorTest)
      renderer.setClearColor(previousClear, previousClearAlpha)
      restoreVisibility(hidden)
    }
  }

  return {
    pick,
    dispose: () => {
      if (disposed) return
      disposed = true
      target.dispose()
      material.dispose()
    },
  }
}

interface HiddenObject {
  object: Object3D
  visible: boolean
}

function hideNonBlockObjects(scene: Scene, keep: Object3D): HiddenObject[] {
  const hidden: HiddenObject[] = []
  for (const child of scene.children) {
    if (child === keep) continue
    hidden.push({ object: child, visible: child.visible })
    child.visible = false
  }
  return hidden
}

function restoreVisibility(hidden: HiddenObject[]): void {
  for (const entry of hidden) entry.object.visible = entry.visible
}
