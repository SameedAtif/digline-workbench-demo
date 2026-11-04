# Task 06.02 — Slice plane

A draggable `THREE.Plane` that clips the block field, with a thin handle gizmo and axis snapping.

> Inherits from `docs/modules/06-interaction.md`.

---

## 1. What this task is
A visible, draggable plane. Dragging it updates the clipping-plane uniform read by the block shader (added in this task).

## 2. What this task is not
Not multiple slices. One plane. Rotation snapped to X/Y/Z unless Shift is held.

## 3. Scope

### In
- `createSlicePlane({ viewer, blockField }) → SlicePlane`.
- A `THREE.Mesh` of a thin quad with a wireframe outline as the handle.
- `THREE.Plane` passed to the block material as `clippingPlanes` (and the shader samples `uClipPlane`, discarding when `dot(worldPos, normal) + constant < 0`).
- Pointer drag:
  - On pointerdown, record the ray intersection with the plane.
  - On pointermove, translate the plane along its normal by the drag delta projected onto the normal.
  - On Shift drag, allow free rotation (axis-constrained to the plane's current up).
- Toggle on/off via store flag; off hides the handle and clears clipping.

### Out
- Multi-plane CSG.
- Transform gizmos.

## 4. Tools and technology
`THREE.Plane`, `renderer.localClippingEnabled = true`, pointer events.

## 5. Code structure delta
```
+ src/render/interaction/slice-plane.ts
+ src/render/blocks/block.frag.glsl    (updated: clip discard)
+ src/state/slices/ui.slice.ts         (updated: sliceEnabled)
+ tests/unit/render/interaction/slice-plane.test.ts
```

## 6. Design patterns
- **Observer** — pointer events in; plane coefficients out, read by the shader uniform.
- **Snap-to-axis strategy** — a tiny helper rounds the normal to the closest unit axis unless Shift is held.

## 7. Best practices and references
- Three.js clipping planes — mrdoob's `webgl_clipping` example.
- Pointer events for 3D UI — Jake Archibald on pointer events; the Pointer Events Level 2 spec.
- Avoiding the full `TransformControls` for a single slice — WestLangley's forum answers.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | Enabling the slice sets `renderer.localClippingEnabled = true` | Vitest |
| T02 | Dragging the plane 5m along its normal updates `plane.constant` by -5 (sign convention) | Vitest |
| T03 | Snap-to-axis: a near-X normal snaps to exactly `(1,0,0)` | Vitest |
| T04 | Shift held bypasses snap | Vitest |
| T05 | Blocks on the clipped side are discarded in the fragment shader (readback test) | Vitest |
| T06 | Disabling slice hides the handle Mesh and clears the clipping plane | Vitest |
| T07 | Dragging on a 500k scene stays above 60fps on manual run | Documented, not CI |

## 9. Done means
- Dragging the handle in `pnpm dev` sweeps the bench in half smoothly.
- Hiding the slice restores the full field without a reload.
