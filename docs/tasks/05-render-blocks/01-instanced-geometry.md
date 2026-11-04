# Task 05.01 — Instanced geometry

Build an `InstancedMesh` of up to 500,000 cube blocks, with per-instance attributes bound directly to the `BlockModel` typed arrays. One draw call.

> Inherits from `docs/modules/05-render-blocks.md`.

---

## 1. What this task is
`createBlockField(model) → BlockField` — a Three.js `Object3D` with a `BoxGeometry(1,1,1)` and per-instance attributes for position-0, position-1, grade, material, size. Material is a `MeshBasicMaterial` placeholder; the custom shader lands in the next task.

## 2. What this task is not
Not the shader. Not the color ramp. Not clipping or cutoff.

## 3. Scope

### In
- `createBlockField(model: BlockModel) → BlockField`.
- `InstancedMesh(unitBox, placeholderMaterial, model.count)`.
- Per-instance attributes added to the geometry:
  - `aPos0` (vec3), initial from `model.x`, `model.y`, `model.z`.
  - `aPos1` (vec3), initially a copy of `aPos0` (updated by task 05.02's model when `applyField` is called upstream).
  - `aGrade` (float), from `model.grade`.
  - `aMaterial` (float, encoded `MaterialId`).
  - `aSize` (float), from `model.size`.
- Attributes use `InstancedBufferAttribute` wrapping the typed arrays with `dynamic = false` initially.
- `blockField.updatePostBlast(positions1)` — swaps the `aPos1` buffer and marks the attribute `needsUpdate`.
- Uses the viewer's `add(blockField)` to put itself in the scene.

### Out
- Shader material.
- Picking.
- Any animation.

## 4. Tools and technology
Three.js `InstancedMesh`, `InstancedBufferAttribute`, `BufferGeometry.setAttribute`.

## 5. Public surface
```ts
export { createBlockField };
export type { BlockField };
```

## 6. Code structure delta
```
+ src/render/blocks/attributes.ts
+ src/render/blocks/instanced-blocks.ts
+ src/render/blocks/index.ts
+ tests/unit/render/blocks/instanced.test.ts
```

## 7. Design patterns
- **Entity–component data** — one typed array per attribute; no `Block` object anywhere.
- **Buffer sharing** — `InstancedBufferAttribute` wraps the `BlockModel` buffers directly, no copy.

## 8. Best practices and references
- `webgl_instancing_dynamic` example — mrdoob and Fernando Serrano.
- `InstancedBufferAttribute` performance — Patrick Cozzi, *WebGL Insights* chapter 3.
- Avoid per-frame CPU writes to instance matrices — Three.js forum threads by WestLangley.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | For a 100-block `BlockModel`, the field's `instanceCount === 100` | Vitest |
| T02 | `geometry.attributes.aPos0.array === model.x`-combined-view (asserts no copy) | Vitest |
| T03 | `updatePostBlast(newArr)` swaps `aPos1.array` to `newArr` and sets `needsUpdate = true` | Vitest |
| T04 | Rendering the field increments `renderer.info.render.calls` by exactly 1 | Vitest w/ a stub renderer that counts calls |
| T05 | For 500,000 blocks on an M-series Mac in a manual run, the scene renders at ≥ 60fps (documented in README, not CI) | Manual |
| T06 | Memory: `renderer.info.memory.geometries === 1` after add | Vitest |

## 10. Done means
- The field renders as a cloud of unit cubes at the correct positions, visible in `pnpm dev`.
- Opening the HUD (toggle lands in task 05.04) shows one draw call.
