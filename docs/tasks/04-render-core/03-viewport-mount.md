# Task 04.03 — React Viewport and `useViewer`

A React component that owns the lifecycle of a `Viewer` and exposes it to sibling components via a context hook.

> Inherits from `docs/modules/04-render-core.md`.

---

## 1. What this task is
`<Viewport/>` creates a `Viewer` on mount, provides it to children via `<ViewerContext.Provider>`, and disposes it on unmount. `useViewer()` reads it.

## 2. What this task is not
Not any rendered 3D content.

## 3. Scope

### In
- `Viewport.tsx` — mounts a `<canvas ref>` wrapped by a `<div>`.
- Creates `Viewer` once with `useLayoutEffect`; starts the loop; `start()`.
- On unmount: `stop()`, `dispose()`.
- Context `ViewerContext` with the current `Viewer | null`.
- Hook `useViewer()` — throws (in dev) if used outside a `Viewport`.
- HMR safety: a module-level `WeakRef<Viewer>` sentinel disposes a stale viewer on hot update.

### Out
- Any store wiring (that's in `state/`, used from module 05 onwards).
- Any UI chrome.

## 4. Tools and technology
React 19, Three.js, Vitest + RTL, jsdom with `canvas-mock`.

## 5. Public surface
```ts
export { Viewport, useViewer, ViewerContext };
```

## 6. Code structure delta
```
+ src/ui/Viewport.tsx          (replaces earlier stub)
+ src/ui/useViewer.ts
+ src/ui/viewer-context.ts
+ tests/unit/ui/Viewport.test.tsx
```

## 7. Design patterns
- **Provider pattern** — one `ViewerContext` tree.
- **Lifecycle encapsulation** — the viewer belongs to the component; teardown is guaranteed.

## 8. Best practices and references
- `useLayoutEffect` for DOM-measuring init — Dan Abramov on effect timing.
- `useSyncExternalStore` (used from module 05 onwards) — Andrew Clark design notes; mentioned here for continuity.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `<Viewport/>` renders a `<canvas>` child | RTL |
| T02 | A child using `useViewer()` receives a non-null viewer after mount | RTL + context |
| T03 | A hook user outside `<Viewport/>` throws in dev with a clear message | RTL + `expect().toThrow()` |
| T04 | Unmounting calls `viewer.dispose()` (spy) exactly once | RTL + Vitest spy |
| T05 | Re-mounting creates a fresh viewer (new reference) | RTL + spy on `createViewer` |
| T06 | Under simulated HMR (manually invoking the dispose sentinel) the old viewer disposes before the new one starts | Vitest |
| T07 | Window resize via `ResizeObserver` propagates to the viewer within 2 rAF ticks | Vitest, fake timers |

## 10. Done means
- All tests pass.
- `pnpm dev` shows a dark viewport that can be orbited with the mouse (manual check, screenshot committed).
- No React key or ref warnings in the console.
