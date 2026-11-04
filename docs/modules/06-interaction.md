# Module 06 — `interaction`

Pointing at things and telling the renderer what to show or hide. Picking a block, dragging a slice plane, moving a grade-cutoff slider, drawing the origin-to-destination trace line.

> Inherits from `PROJECT.md`.

---

## 1. What this module is

Three cooperating pieces:

- `Picker` — turns a mouse event on the canvas into the index of the block under the cursor. Uses GPU readback (one 1×1 pixel from an off-screen "id" render target).
- `SlicePlane` — a draggable `THREE.Plane` with a handle gizmo; the plane is passed to the `BlockField` material as a clipping plane.
- `TraceLine` — on block click, draws a dashed line from the block's pre-blast to post-blast centroid and surfaces the block's grade and material in a side panel through the store.

The grade cutoff slider itself is a UI slider in `ui/`; this module just exposes the shader uniform it writes to via the store.

## 2. What this module is not

- Not a polygon tool. That is module 07.
- Not a measurement tool.
- Not multi-select. One picked block at a time.

## 3. Scope

### In scope
- GPU picking with one off-screen `WebGLRenderTarget` (R8G8B8A8), packing instance id as RGBA.
- Fallback raycast via `three-mesh-bvh` on the `InstancedMesh` for debugging; off by default.
- Slice plane with:
  - 3D handle (a small translucent quad with grabber dots on edges).
  - Pointer drag along the plane normal.
  - Snap to axis-aligned normals (X/Y/Z) by default; free rotation held under Shift.
- Trace line pooled across clicks; disposed on model swap.

### Out of scope
- Box select, lasso select.
- Measurement rulers.
- Snapping to grid or block centroids beyond the slice.

## 4. Tools and technology

| Thing | Choice |
|---|---|
| Picking | GPU id buffer, 1 pixel readback via `renderer.readRenderTargetPixels` |
| Raycast fallback | `three-mesh-bvh` on `InstancedMesh` |
| Gizmos | Hand-rolled, no `TransformControls` (too heavy for this one slice) |

## 5. Features the rest of the app will consume

```ts
import {
  createPicker, Picker,
  createSlicePlane, SlicePlane,
  createTraceLine, TraceLine,
} from '@/render/interaction';
```

## 6. Code structure

```
src/render/interaction/
├── index.ts
├── picker.ts           # id-buffer render target, pointer→instanceId
├── slice-plane.ts      # Plane + handle Mesh, drag logic
├── trace-line.ts       # pooled Line2 or LineSegments
└── picking.vert.glsl   # minimal vs that writes aIndex to colour
└── picking.frag.glsl
```

## 7. Design patterns

- **Command pattern** — a block pick dispatches a `select(blockIndex)` action to the store; the renderer reacts via subscription.
- **Object pool** — trace-line segments are reused rather than allocated per click.
- **Observer** — slice-plane drag publishes plane coefficients to the store; the block shader reads them as uniforms.

## 8. Best practices and references

- **GPU picking via id buffer** — Fabien Sanglard's "The Nuances of GPU Picking"; the Three.js forum thread by donmccurdy on InstancedMesh picking.
- **BVH acceleration** — Garrett Johnson's `three-mesh-bvh` docs, especially the InstancedMesh guide.
- **Clipping planes passed as uniforms** — mrdoob's `webgl_clipping` and `webgl_clipping_advanced` examples.
- **Pointer events over mouse events** — Jake Archibald on unified pointer events; MDN pointer events spec.

## 9. Done means

- Clicking any block within 100ms of pointer-up returns the correct index on a 500k-block scene.
- Dragging the slice plane never drops below 60fps.
- The trace line matches the block's pre- and post-blast positions as `uT` changes.
- Disposing the picker frees its render target without a leak warning.

## 10. Tasks (ordered)

1. `docs/tasks/06-interaction/01-picker.md` — GPU id-buffer picker + unit tests on a synthetic scene.
2. `docs/tasks/06-interaction/02-slice-plane.md` — plane + handle + drag + clipping uniform.
3. `docs/tasks/06-interaction/03-trace-line.md` — pooled line segments, store integration, side panel binding.
