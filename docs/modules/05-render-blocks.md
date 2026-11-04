# Module 05 — `render-blocks`

> **As-built:** this module is implemented. See `docs/IMPLEMENTATION.md` for final architecture and deviations from this plan.

The hero of the project. An `InstancedMesh` of up to 500,000 blocks with a custom `ShaderMaterial` that interpolates each block between its pre-blast and post-blast position in the vertex shader. One draw call. No per-frame JS per block.

> Inherits from `PROJECT.md`.

---

## 1. What this module is

- `BlockField`: a Three.js `Object3D` that owns an `InstancedMesh`, its `BufferGeometry`, and its `ShaderMaterial`.
- Per-instance attributes stored as `InstancedBufferAttribute`s referencing the typed-array buffers from the `BlockModel`:
  - `aPos0` — pre-blast centroid (vec3)
  - `aPos1` — post-blast centroid (vec3), computed on the main thread when a `VectorField` is applied
  - `aGrade` — grade (float)
  - `aMaterial` — material id (uint8 packed into float)
  - `aSize` — block edge length (float)
- A `uT` uniform drives the interpolation.
- A 1D texture holds a colour ramp (`viridis` by default, swappable).
- The fragment shader discards blocks below the current grade cutoff and respects the slice plane via a custom `uClipPlane` discard.
- The vertex shader also adds a ballistic arc, deterministic tumble and normal-based face shading.

## 2. What this module is not

- Not a picker. Picking is in module 06.
- Not an animator. The `uT` uniform is set from state; this module does not own a clock.
- Not a particle system. Blocks are axis-aligned cubes with real geometry.

## 3. Scope

### In scope
- `createBlockField(model: BlockModel) → BlockField`.
- Shader-side interpolation `mix(aPos0, aPos1, uT)` plus arc/tumble/shading, with no per-frame JS writes to the matrix array.
- Grade-based colour via a 1D ramp texture; `uCutoff` hides below-cutoff blocks.
- Clipping plane uniform for the slice.
- `blockField.updatePostBlast(positions1)` for when the field changes.
- `blockField.dispose()`.

### Out of scope
- Smooth per-block entry/exit animations.
- Shadow casting or receiving.
- Level-of-detail swapping; we rely on instancing + frustum culling only.

## 4. Tools and technology

| Thing | Choice |
|---|---|
| Mesh | `THREE.InstancedMesh` with `BoxGeometry(1,1,1)` scaled per-instance via `aSize` |
| Material | `THREE.ShaderMaterial` |
| GLSL plugin | `vite-plugin-glsl` for `.vert.glsl` / `.frag.glsl` imports |
| Colour ramp | A 256×1 `DataTexture` with linear filtering |

## 5. Features the rest of the app will consume

```ts
import { createBlockField, BlockField } from '@/render/blocks';
```

## 6. Code structure

```
src/render/blocks/
├── index.ts
├── instanced-blocks.ts    # createBlockField, BlockField class
├── block.vert.glsl        # position = mix(aPos0, aPos1, uT) + aSize * position
├── block.frag.glsl        # ramp lookup, cutoff fade, clipping discard
├── color-ramp.ts          # DataTexture builder for viridis / magma / neutral
└── attributes.ts          # typed helpers to bind BlockModel buffers as InstancedBufferAttributes
```

## 7. Design patterns

- **Entity–Component (data-oriented)** — the "entity" (a block) exists only as an index into parallel arrays. No `Block` object is ever constructed in render code.
- **Shader-side interpolation** — the hot path lives on the GPU; the CPU only updates one uniform.
- **Resource ownership** — `BlockField` owns its geometry, material, ramp texture and attribute buffers, and disposes them all.

## 8. Best practices and references

- **Instanced attributes** — mrdoob (Ricardo Cabello) and Fernando Serrano in the Three.js examples; the `webgl_instancing_dynamic` example.
- **`ShaderMaterial` conventions** — Yuri Artyukh's shader tutorials; the Three.js docs on `onBeforeCompile` (used in a later task if we need to hook into standard materials).
- **Instanced buffers from typed arrays** — Patrick Cozzi's *WebGL Insights* chapter on instancing.
- **Colour ramps as 1D textures** — Fernando Serrano's post on data textures in Three.js; the matplotlib `viridis` team's rationale for perceptually uniform ramps.
- **Clipping planes** — Three.js docs example `webgl_clipping` by mrdoob.
- **Avoid branching in shaders** — Inigo Quilez's shader performance notes.

## 9. Done means

- 500,000 blocks at 60fps on an M-series Mac in Chrome, with HUD showing one draw call.
- Scrubbing `uT` from 0 to 1 moves blocks smoothly without CPU spikes.
- Changing the colour ramp or grade cutoff is instantaneous (one uniform write).
- `blockField.dispose()` leaves `renderer.info` counts at zero.
- Shader compiles with no warnings on both ANGLE and WebGL2.

## 10. Tasks (ordered)

1. `docs/tasks/05-render-blocks/01-instanced-geometry.md` — geometry, instance count, per-instance attributes bound from `BlockModel`.
2. `docs/tasks/05-render-blocks/02-shader.md` — vertex + fragment shader, `uT` interpolation, cutoff fade.
3. `docs/tasks/05-render-blocks/03-color-ramp.md` — ramp texture, colour modes, uniform plumbing.
4. `docs/tasks/05-render-blocks/04-dispose-and-swap.md` — model swap without leaks, benchmarks, HUD counters.
