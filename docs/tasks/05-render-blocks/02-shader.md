# Task 05.02 — Custom shader

Replace the placeholder material with a `ShaderMaterial`. Interpolate between `aPos0` and `aPos1` in the vertex shader using a `uT` uniform. Fragment shader is a solid colour for now; the ramp lands next task.

> Inherits from `docs/modules/05-render-blocks.md`.

---

## 1. What this task is
Vertex shader `position = mix(aPos0, aPos1, uT) + aSize * position` (position is the unit cube corner). Fragment shader outputs a slate blue, with a `uCutoff` fade placeholder.

## 2. What this task is not
Not the color ramp texture. Not clipping planes. Not picking.

## 3. Scope

### In
- `block.vert.glsl`:
  - Inputs: `aPos0`, `aPos1`, `aSize`, `aGrade`, `aMaterial`.
  - Uniforms: `uT: float`, `uProjectionMatrix`, `uViewMatrix`, `uModelMatrix` (via Three.js built-ins).
  - Varyings: `vGrade`, `vMaterial` (float).
  - Logic: `vec3 center = mix(aPos0, aPos1, uT); vec3 world = center + position * aSize; gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);`.
- `block.frag.glsl`:
  - Uniforms: `uCutoff: float`.
  - Logic: `float a = step(uCutoff, vGrade); gl_FragColor = vec4(colorFor(vGrade), a); if (a < 0.01) discard;`.
  - `colorFor(g)` is a placeholder: a hard-coded dark-to-light interpolation. Replaced in task 05.03.
- `ShaderMaterial` wires attributes and uniforms; `transparent: true` for the cutoff fade.
- `blockField.setT(t: number)` and `blockField.setCutoff(c: number)` write the uniforms.

### Out
- A real color ramp (next task).
- Lighting. Flat colour only.
- Clipping (task 06.02).

## 4. Tools and technology
`vite-plugin-glsl` for `.glsl` imports, Three.js `ShaderMaterial`, GLSL ES 3.0.

## 5. Code structure delta
```
+ src/render/blocks/block.vert.glsl
+ src/render/blocks/block.frag.glsl
+ src/render/blocks/instanced-blocks.ts   (updated)
+ tests/unit/render/blocks/shader.test.ts
```

## 6. Design patterns
- **Shader-side computation** — displacement, cutoff and (next) colour are all GPU-side.
- **Uniform-driven animation** — JS writes one float per frame, nothing more.

## 7. Best practices and references
- `onBeforeCompile` vs `ShaderMaterial` — Yuri Artyukh's shader tutorials. We pick `ShaderMaterial` for full control.
- Avoid branches, prefer `step`/`mix` — Inigo Quilez.
- GLSL versioning in Three.js — mrdoob's docs on `glslVersion: THREE.GLSL3`.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | Shader compiles without warnings on WebGL2 | Vitest with headless-gl or a mocked compile check |
| T02 | `blockField.setT(0.5)` writes `0.5` into `material.uniforms.uT.value` | Vitest |
| T03 | `blockField.setT` is clamped to [0, 1] | Vitest |
| T04 | At `uT = 0`, world positions equal `aPos0 + unitCorner * aSize` for a sampled instance | Vitest, read back via a small off-screen render + readPixels on a 1-pixel target |
| T05 | At `uT = 1`, world positions equal `aPos1 + unitCorner * aSize` | same technique |
| T06 | `blockField.setCutoff(0.5)` fades out any block with `aGrade < 0.5` | Vitest, read back colour of a known-grade block |

## 9. Done means
- `pnpm dev` shows the block field scrubbing smoothly from pre-blast to post-blast as a dev-only `<input type="range">` writes `uT`.
- No shader warnings on Chrome DevTools "Capture WebGL frame".
