import {
  BoxGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  ShaderMaterial,
  Vector4,
  type IUniform,
} from 'three'

import type { BlockModel } from '@/domain'

import fragmentShader from './block.frag.glsl'
import vertexShader from './block.vert.glsl'
import { makeRamp, type RampName } from './color-ramp'

export type BlockColorMode = 'grade' | 'material' | 'neutral'

const COLOR_MODE_VALUE: Record<BlockColorMode, number> = {
  grade: 0,
  material: 1,
  neutral: 2,
}

interface BlockUniforms {
  uT: IUniform<number>
  uCutoff: IUniform<number>
  uGradeMax: IUniform<number>
  uColorMode: IUniform<number>
  uOpacity: IUniform<number>
  uRamp: IUniform<unknown>
  uClipEnabled: IUniform<number>
  uClipPlane: IUniform<Vector4>
}

export interface BlockField {
  readonly object: InstancedMesh
  readonly mesh: InstancedMesh
  readonly material: ShaderMaterial
  readonly uniforms: BlockUniforms
  readonly count: number
  setT(t: number): void
  setCutoff(cutoff: number): void
  setGradeMax(gradeMax: number): void
  setColorMode(mode: BlockColorMode): void
  setRamp(name: RampName): void
  setClipPlane(
    enabled: boolean,
    normal: { x: number; y: number; z: number },
    constant: number,
  ): void
  updatePostBlast(post: BlockModel): void
  dispose(): void
}

function interleave(model: BlockModel): Float32Array {
  const out = new Float32Array(model.count * 3)
  for (let i = 0; i < model.count; i += 1) {
    out[i * 3] = model.x[i] ?? 0
    out[i * 3 + 1] = model.y[i] ?? 0
    out[i * 3 + 2] = model.z[i] ?? 0
  }
  return out
}

export function createBlockField(model: BlockModel): BlockField {
  const geometry = new BoxGeometry(1, 1, 1)
  const pos0 = interleave(model)
  const pos1 = interleave(model)
  const materials = new Float32Array(model.count)
  for (let i = 0; i < model.count; i += 1) materials[i] = model.material[i] ?? 0

  const aPos0 = new InstancedBufferAttribute(pos0, 3)
  const aPos1 = new InstancedBufferAttribute(pos1, 3)
  const aGrade = new InstancedBufferAttribute(new Float32Array(model.grade), 1)
  const aMaterial = new InstancedBufferAttribute(materials, 1)
  const aSize = new InstancedBufferAttribute(new Float32Array(model.size), 1)

  geometry.setAttribute('aPos0', aPos0)
  geometry.setAttribute('aPos1', aPos1)
  geometry.setAttribute('aGrade', aGrade)
  geometry.setAttribute('aMaterial', aMaterial)
  geometry.setAttribute('aSize', aSize)

  const uniforms: BlockUniforms = {
    uT: { value: 0 },
    uCutoff: { value: 0 },
    uGradeMax: { value: 4 },
    uColorMode: { value: 0 },
    uOpacity: { value: 1 },
    uRamp: { value: makeRamp('viridis') },
    uClipEnabled: { value: 0 },
    uClipPlane: { value: new Vector4(1, 0, 0, 0) },
  }

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: uniforms as unknown as Record<string, IUniform>,
    transparent: true,
    depthWrite: true,
    clipping: false,
  })

  const mesh = new InstancedMesh(geometry, material, Math.max(1, model.count))
  mesh.count = model.count
  mesh.frustumCulled = false
  mesh.name = 'block-field'

  let ramp = uniforms.uRamp.value as ReturnType<typeof makeRamp>

  const field: BlockField = {
    object: mesh,
    mesh,
    material,
    uniforms,
    count: model.count,
    setT: (t) => {
      uniforms.uT.value = Math.max(0, Math.min(1, t))
    },
    setCutoff: (cutoff) => {
      uniforms.uCutoff.value = cutoff
    },
    setGradeMax: (gradeMax) => {
      uniforms.uGradeMax.value = Math.max(0.0001, gradeMax)
    },
    setColorMode: (mode) => {
      uniforms.uColorMode.value = COLOR_MODE_VALUE[mode]
    },
    setRamp: (name) => {
      const next = makeRamp(name)
      uniforms.uRamp.value = next
      ramp.dispose()
      ramp = next
    },
    setClipPlane: (enabled, normal, constant) => {
      uniforms.uClipEnabled.value = enabled ? 1 : 0
      uniforms.uClipPlane.value.set(normal.x, normal.y, normal.z, constant)
    },
    updatePostBlast: (post) => {
      const array = aPos1.array as Float32Array
      for (let i = 0; i < model.count; i += 1) {
        array[i * 3] = post.x[i] ?? 0
        array[i * 3 + 1] = post.y[i] ?? 0
        array[i * 3 + 2] = post.z[i] ?? 0
      }
      aPos1.needsUpdate = true
    },
    dispose: () => {
      geometry.dispose()
      material.dispose()
      ramp.dispose()
    },
  }

  return field
}
