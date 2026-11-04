# Task 04.02 — Resize and dispose

`ResizeObserver` on the canvas's parent, DPR cap at 2, full dispose chain. The viewer survives repeated mount/unmount under Vite HMR without leaks.

> Inherits from `docs/modules/04-render-core.md`.

---

## 1. What this task is
Add `resize(width, height)`, a `ResizeObserver`-driven call to it, and `dispose()` that tears down everything the viewer owns.

## 2. What this task is not
Not React mount/unmount — that is the next task.

## 3. Scope

### In
- `viewer.resize(w, h)` updates `renderer.setSize(w, h, false)`, `camera.aspect`, `camera.updateProjectionMatrix()`, and sets `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`.
- A `ResizeObserver` watches the canvas's parent and calls `resize` on contentRect changes, debounced to animation frames.
- `viewer.dispose()`:
  - `stop()` the loop.
  - Disconnect the `ResizeObserver`.
  - Dispose `OrbitControls`.
  - Traverse the scene; dispose every `geometry`, `material`, and `texture`.
  - Call `renderer.dispose()` and `renderer.forceContextLoss()`.
  - Null out internal references so GC can collect.

### Out
- Full-screen mode.
- Multi-canvas / multi-viewer coordination.

## 4. Tools and technology
`ResizeObserver`, Three.js dispose APIs.

## 5. Code structure delta
```
+ src/render/core/resize.ts
+ src/render/core/viewer.ts  (updated)
+ tests/unit/render/core/resize.test.ts
+ tests/unit/render/core/dispose.test.ts
```

## 6. Design patterns
- **Resource ownership** — the viewer disposes exactly what it created.
- **Observer** — resize events are observed, not polled.

## 7. Best practices and references
- Three.js dispose docs — mrdoob and Michał Iwańczuk (prisoner849).
- `ResizeObserver` — Surma's "Minimalist's guide to ResizeObserver".
- DPR cap at 2 — Gregg Tavares, Three.js fundamentals.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | `resize(800, 600)` sets `camera.aspect = 800/600` | Vitest |
| T02 | `resize` sets renderer size to 800×600 (`renderer.getSize()`) | Vitest |
| T03 | `devicePixelRatio = 3` caps `renderer.getPixelRatio()` at 2 | Vitest, stub `devicePixelRatio` |
| T04 | A simulated `ResizeObserver` entry triggers one `resize` per animation frame, not per event | Vitest, fake timers + rAF |
| T05 | `dispose()` sets `renderer.info.memory.geometries` and `textures` to 0 after adding and removing a mesh | Vitest |
| T06 | `dispose()` disconnects the `ResizeObserver` (asserted via a spy) | Vitest |
| T07 | Calling `dispose()` twice is a no-op (no throw) | Vitest |

## 9. Done means
- All tests pass.
- Running `pnpm dev` and HMR-saving `viewer.ts` ten times leaves `renderer.info` counts at a stable, small number (observed manually and documented).
