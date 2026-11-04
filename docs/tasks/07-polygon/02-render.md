# Task 07.02 — Polygon rendering with shared displacement

Render the polygon as a `Line2` outline and an `earcut`-triangulated fill, with a vertex shader that applies the same `VectorField`-based displacement the blocks use. Outline and blocks move together.

> Inherits from `docs/modules/07-polygon.md`.

---

## 1. What this task is
`createPolygonLayer({ viewer, store, model, field }) → PolygonLayer`. Reads vertices from the store; outputs an outline and a fill that scrub with `uT`.

## 2. What this task is not
Not vertex handles. That's task 07.03's domain. (Handles live in `polygon-handles.ts` in render, drawn here as a stub, driven next task.)

Wait — handles are drawn here, driven in the next task. Clarify: this task draws the outline+fill and the vertex handle meshes (small instanced cubes), but the pointer logic for dragging handles comes with history/undo in task 07.03. The handles are just visible markers for now.

## 3. Scope

### In
- `polygon-mesh.ts`:
  - Outline: `Line2` with `LineMaterial({ linewidth: 2, worldUnits: false })`.
  - Fill: `Mesh` with `BufferGeometry` whose indices come from `earcut(vertices2d)`.
  - Both use a `ShaderMaterial` extended from the block vert shader, sharing the displacement function via a GLSL `#include` (`vite-plugin-glsl` supports `#include`).
- Updates on store subscription:
  - When vertices change, rebuild the geometry (cheap at ≤ 100 vertices).
  - `uT` and vector-field uniforms shared with the block field (same `UniformsGroup` or a tiny shared uniforms object).
- Dispose chain on unmount or model swap.

### Out
- Drag interaction (next task).
- Metrics panel (last task of this module).

## 4. Tools and technology
`Line2`, `LineGeometry`, `earcut`, shared GLSL `#include` for displacement, `vite-plugin-glsl` include support.

## 5. Code structure delta
```
+ src/render/polygon/displacement.inc.glsl   # shared with block.vert.glsl
+ src/render/polygon/polygon-mesh.ts
+ src/render/polygon/polygon-handles.ts
+ src/render/polygon/polygon.vert.glsl
+ src/render/polygon/polygon.frag.glsl
+ src/render/polygon/index.ts
+ src/render/blocks/block.vert.glsl           (updated: #include displacement.inc.glsl)
+ tests/unit/render/polygon/mesh.test.ts
```

## 6. Design patterns
- **Shared shader include** — one source of truth for the displacement function.
- **Observer** — layer subscribes to `polygon.slice` and `blast.slice`.
- **Composition** — the fill mesh composes the outline, not the other way around.

## 7. Best practices and references
- `earcut` — Vladimir Agafonkin's paper and docs; used by Mapbox GL.
- `Line2` width consistency — WestLangley's forum answers.
- GLSL `#include` via Vite — `vite-plugin-glsl` docs (UNDEFINE on repeat includes).

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | A 4-vertex square polygon triangulates to 2 triangles | Vitest, assert `index.count === 6` |
| T02 | Updating a vertex via `moveVertex` rebuilds the geometry (compare `geometry.id` or a dirty counter) | Vitest |
| T03 | `uT = 0` places outline vertices exactly at store coordinates (readback) | Vitest |
| T04 | `uT = 1` places outline vertices at `vertex + field.sample(vertex)` (readback) | Vitest |
| T05 | Outline and block field read the same `uT` uniform (identity check) | Vitest |
| T06 | Dispose releases geometries, line materials, fill material | Vitest |
| T07 | Handles mesh instance count equals polygon vertex count | Vitest |
| T08 | A degenerate polygon (self-intersecting) does not crash the renderer; fill is empty, outline shows | Vitest |

## 9. Done means
- Drawing a polygon in `pnpm dev`, closing it, and scrubbing `uT` shows the polygon deform smoothly with the blocks.
- No shader include duplication warnings in the console.
