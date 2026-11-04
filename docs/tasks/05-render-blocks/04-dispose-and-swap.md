# Task 05.04 — Dispose, model swap, HUD

Swap models without leaking GPU memory. Expose a `BlockField.dispose()`. Add the perf HUD (FPS, draw calls, instance count, memory).

> Inherits from `docs/modules/05-render-blocks.md`.

---

## 1. What this task is
Cleanly tear down a `BlockField` and swap it for a new one; add a toggleable overlay reporting live render stats.

## 2. What this task is not
Not benchmarking automation. Numbers are observed, not CI-asserted.

## 3. Scope

### In
- `blockField.dispose()`: dispose geometry, material, ramp texture, remove from scene, null internal refs.
- `swapBlockField(viewer, oldField, newModel)` helper that disposes the old and adds the new in one atomic step.
- Store slice (`scene.slice.ts`) `setModel(model)` triggers the swap via the renderer-side subscriber.
- `HUD.tsx`:
  - FPS (moving avg over 60 frames).
  - Last frame time (ms).
  - `renderer.info.render.calls`.
  - `renderer.info.memory.geometries`, `textures`.
  - Instance count.
  - Toggle via `D` key; off by default.

### Out
- Automated benchmark CI.
- Memory profiling tools.

## 4. Tools and technology
`renderer.info`, `performance.now()`, tiny React overlay.

## 5. Code structure delta
```
+ src/render/blocks/dispose.ts
+ src/ui/HUD.tsx
+ src/state/slices/scene.slice.ts   (updated: setModel)
+ tests/unit/render/blocks/dispose.test.ts
+ tests/unit/ui/HUD.test.tsx
```

## 6. Design patterns
- **Atomic swap** — the old field only disposes after the new one is added, preventing a blank frame.
- **Observer** — HUD subscribes to the viewer's `onFrame`, not React state, to avoid re-render on every frame.

## 7. Best practices and references
- `renderer.info` — Three.js docs.
- Moving-average FPS — Mariko Kosaka's performance posts.
- Keyboard-toggled overlays — same pattern as Three.js's own `stats.js` by mrdoob.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | `blockField.dispose()` sets `renderer.info.memory.geometries` from 1 to 0 | Vitest |
| T02 | `blockField.dispose()` disposes the ramp `DataTexture` (spy on `texture.dispose`) | Vitest |
| T03 | `swapBlockField` increases scene children by 0 (old removed, new added) | Vitest |
| T04 | After 50 swaps, `renderer.info.memory.*` are the same as after the first | Vitest, memory leak probe |
| T05 | HUD toggles on `D` keydown | RTL |
| T06 | HUD FPS reads > 30 when the viewer runs 60 frames in 1s (fake timers) | Vitest |
| T07 | HUD does not cause React re-render on every frame (asserted by counting renders of the parent) | Vitest + a render counter |

## 9. Done means
- Reload a 500k-block scene 10 times in a row with no growth in `renderer.info.memory.*`.
- HUD on-screen in `pnpm dev`, FPS steady at the budgeted number on the tested hardware; number recorded in `README.md`.
