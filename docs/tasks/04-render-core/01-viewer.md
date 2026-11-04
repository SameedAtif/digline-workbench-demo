# Task 04.01 — Viewer

A `Viewer` factory that builds a Three.js scene, renderer, camera, orbit controls and a `rAF` loop. No content yet beyond a `GridHelper` behind a dev flag.

> Inherits from `docs/modules/04-render-core.md`.

---

## 1. What this task is
Minimal 3D runtime wrapped in a tiny imperative API.

## 2. What this task is not
Not React. Not a block field. Not resize or dispose plumbing — those are the next task.

## 3. Scope

### In
- `createViewer({ canvas, pixelRatio?, antialias?, devHelpers? }) → Viewer`.
- `Viewer`: `{ scene, camera, renderer, controls, add, remove, onFrame, start, stop }`.
- `start()` begins a `requestAnimationFrame` loop that calls each `onFrame` callback and then `renderer.render(scene, camera)`.
- `stop()` cancels the loop (used in tests and when the tab is hidden).
- Dev helpers: `GridHelper(100, 100)` and `AxesHelper(10)` behind a `devHelpers: true` flag.

### Out
- `ResizeObserver`, DPR, dispose.
- React, hooks.
- Any content beyond helpers.

## 4. Tools and technology
Three.js r170+, `OrbitControls` from `three/examples/jsm/controls/OrbitControls`.

## 5. Public surface
```ts
export { createViewer };
export type { Viewer };
```

## 6. Code structure delta
```
+ src/render/core/renderer.ts
+ src/render/core/camera.ts
+ src/render/core/controls.ts
+ src/render/core/loop.ts
+ src/render/core/viewer.ts
+ src/render/core/index.ts
+ tests/unit/render/core/viewer.test.ts
```

## 7. Design patterns
- **Facade** over Three.js.
- **Observer** via `onFrame(cb) → unsubscribe`.
- **Resource ownership** — the Viewer tracks what it created (prepared for dispose next task).

## 8. Best practices and references
- Single `requestAnimationFrame` loop — Paul Lewis.
- `OrbitControls` damping on — mrdoob's example `webgl_controls_orbit`.
- Tone mapping defaults — Don McCurdy.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `createViewer({ canvas })` returns a `Viewer` with non-null scene/camera/renderer/controls | Vitest, `OffscreenCanvas` or a stub canvas |
| T02 | `start()` schedules at least one `onFrame` callback within 50ms | Vitest, fake rAF |
| T03 | `stop()` prevents further callbacks | Vitest, assert no calls after `stop()` |
| T04 | `add(obj)` adds to `scene.children`; `remove` reverses it | Vitest |
| T05 | `onFrame(cb)` returns an unsubscribe that removes `cb` from the loop | Vitest |
| T06 | With `devHelpers: true`, scene contains a `GridHelper` and an `AxesHelper` | Vitest |
| T07 | With `devHelpers: false` (default), scene contains neither | Vitest |

## 10. Done means
- All tests pass.
- No DOM references in `viewer.ts` beyond the `canvas` argument.
- `renderer.info.render.calls` increments once per frame.
