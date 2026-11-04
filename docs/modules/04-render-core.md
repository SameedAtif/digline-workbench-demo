# Module 04 — `render-core`

> **As-built:** this module is implemented. See `docs/IMPLEMENTATION.md` for final architecture and deviations from this plan.

The Three.js scaffolding. One `WebGLRenderer`, one `PerspectiveCamera`, one `Scene`, one `OrbitControls`, one `requestAnimationFrame` loop. No content yet.

> Inherits from `PROJECT.md`.

---

## 1. What this module is

A small, framework-agnostic 3D runtime. It exposes a `Viewer` object with:

- `mount(canvas)` / `unmount()`
- `add(object3D)` / `remove(object3D)`
- `onFrame(cb)` for per-frame work
- `resize(width, height)` driven by a `ResizeObserver`
- `dispose()` releasing every GPU resource it owns

A `Viewport.tsx` React component instantiates the `Viewer` on mount and tears it down on unmount.

## 2. What this module is not

- Not a renderer of blocks or polygons. Those are added by modules 5–7.
- Not opinionated about state. The `Viewer` takes imperative calls; the store will drive it from module 05 onwards.
- Not a scenegraph library. It wraps Three.js, it does not reinvent it.

## 3. Scope

### In scope
- `createViewer({ canvas, pixelRatio, antialias }) → Viewer`.
- Orbit, pan, zoom with `three/examples/jsm/controls/OrbitControls`.
- Linear sRGB output, ACES filmic tone mapping, dark `scene.background`.
- A grid helper and an axes helper hidden behind a dev flag.
- Frame budget tracking: moving average FPS, last frame time, draw calls (via `renderer.info`).
- Viewer `onFrame`/`onResize` subscriptions and a `frame(bounds)` reset helper.
- Explicit `dispose()` tearing down geometries, materials, textures, controls, resize observer.
- A `useViewer()` React hook that reads the current `Viewer` for sibling components.
- StrictMode is intentionally not used: disposing and re-creating a `WebGLRenderer` on the same canvas after `forceContextLoss()` loses the context in dev.

### Out of scope
- Post-processing (EffectComposer).
- Shadows. Flat lighting only.
- VR/XR.
- Any physics, raycasting, or picking (lands in module 06).

## 4. Tools and technology

| Thing | Choice |
|---|---|
| 3D | Three.js r170+ |
| Controls | `three/examples/jsm/controls/OrbitControls` |
| React bridge | A thin `Viewport.tsx` + `useViewer()` context |
| Resize | `ResizeObserver` on the canvas's parent |
| Device pixel ratio | Capped at 2 |

## 5. Features the rest of the app will consume

```ts
import { createViewer, Viewer } from '@/render/core';
import { Viewport, useViewer } from '@/ui';
```

## 6. Code structure

```
src/render/core/
├── index.ts
├── viewer.ts         # createViewer, Viewer type
├── renderer.ts       # WebGLRenderer factory with sane defaults
├── camera.ts         # PerspectiveCamera + framing helper
├── controls.ts       # OrbitControls wrapper, damping on
├── loop.ts           # rAF loop with pause/resume
└── resize.ts         # ResizeObserver + DPR cap

src/ui/
└── Viewport.tsx      # mounts Viewer onto a <canvas>, provides useViewer context
```

## 7. Design patterns

- **Facade** — `Viewer` is a tiny facade over Three.js so later modules do not touch the renderer, camera and controls directly.
- **Resource ownership** — the `Viewer` owns every GPU object it creates and disposes them in reverse order on `dispose()`.
- **Observer** — `onFrame(cb)` returns an unsubscribe; callers register and unregister cleanly.

## 8. Best practices and references

- **One `requestAnimationFrame`** — Paul Lewis on single-rAF scheduling and the cost of multiple loops.
- **Dispose discipline** — Michał Iwańczuk (prisoner849) in the Three.js forum; the Three.js docs on `.dispose()` by mrdoob.
- **`ResizeObserver` over `window.resize`** — Surma's posts; MDN.
- **DPR cap at 2** — Gregg Tavares in Three.js fundamentals; the pixel ratio section.
- **Tone mapping defaults** — Don McCurdy's writing on PBR output.

## 9. Done means

- An empty dark scene with a grid helper (dev only) renders at 60fps.
- Resizing the window stays smooth and the canvas stays sharp on a HiDPI display.
- `viewer.dispose()` leaves `renderer.info.memory.geometries` and `textures` at 0.
- Unmounting `Viewport.tsx` calls `dispose()` and does not leak the renderer across HMR reloads.

## 10. Tasks (ordered)

1. `docs/tasks/04-render-core/01-viewer.md` — renderer, camera, scene, controls, loop.
2. `docs/tasks/04-render-core/02-resize-dispose.md` — resize observer, DPR cap, dispose chain.
3. `docs/tasks/04-render-core/03-viewport-mount.md` — React `Viewport.tsx` + `useViewer` hook, HMR safety.
