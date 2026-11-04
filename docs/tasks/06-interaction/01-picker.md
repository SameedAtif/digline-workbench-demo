# Task 06.01 — GPU picker

Turn a pointer event on the canvas into the index of the block under it, via an off-screen "id buffer" render target.

> Inherits from `docs/modules/06-interaction.md`.

---

## 1. What this task is
Second shader program (`picking.vert.glsl` / `picking.frag.glsl`) and a `Picker` facade that renders the scene with that program to a 1×1 render target at the cursor and reads back the pixel.

## 2. What this task is not
Not multi-select, not rectangle select. Not raycasting UI meshes.

## 3. Scope

### In
- `createPicker({ viewer, blockField }) → Picker`.
- `picker.pick(xCss, yCss): number | null` — scissors a 1×1 region, renders with the picking program, reads back the RGBA byte, decodes into an index.
- Picking shader encodes `gl_InstanceID` (plus 1 to reserve 0 for "miss") into RGBA bytes.
- Only runs on explicit `pick()` call (no per-frame overhead).
- Fallback (dev flag only): `three-mesh-bvh` raycast against the `InstancedMesh` to cross-check.

### Out
- Picking non-block geometry (polygon handles use their own BVH, task 07).
- Hover-highlight (added in task 06.03 as part of trace-line).

## 4. Tools and technology
`THREE.WebGLRenderTarget` (R8G8B8A8, 1×1 on readback via scissor), `renderer.readRenderTargetPixels`, `three-mesh-bvh` for the fallback.

## 5. Code structure delta
```
+ src/render/interaction/picker.ts
+ src/render/interaction/picking.vert.glsl
+ src/render/interaction/picking.frag.glsl
+ src/render/interaction/index.ts
+ tests/unit/render/interaction/picker.test.ts
```

## 6. Design patterns
- **Secondary program** — same geometry, different material, swapped only during `pick()`.
- **Lazy readback** — `pick()` is on-demand.

## 7. Best practices and references
- GPU picking via colour id — Fabien Sanglard, "The Nuances of GPU Picking".
- InstancedMesh picking performance — Don McCurdy on the Three.js forum.
- Encoding ints as RGBA bytes — standard pattern; cited in Patrick Cozzi's *WebGL Insights*.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | `pick` on empty area returns `null` | Vitest, synthetic scene |
| T02 | `pick` on a block centred under the cursor returns that block's index | Vitest with a controlled 2×2 scene |
| T03 | Encoding/decoding round-trip: index 123456 → RGBA → 123456 | Vitest pure function test |
| T04 | `pick` does not disturb the main render target (next `render()` renders as before) | Vitest |
| T05 | `pick` cost: ≤ 2ms for a 500k scene on CI (soft threshold, documented) | Vitest `bench` |
| T06 | `dispose()` releases the render target (asserted on `renderer.info`) | Vitest |

## 9. Done means
- Clicking in `pnpm dev` logs the correct instance index to the console (dev-only).
- No visible flicker during picking.
