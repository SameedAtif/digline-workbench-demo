# Task 07.01 — Polygon store and state machine

The data model and finite state machine that drives polygon drawing and editing. Pointer events in, state transitions out. No rendering yet.

> Inherits from `docs/modules/07-polygon.md`.

---

## 1. What this task is
Zustand slice `polygon.slice.ts` and a hand-rolled state machine (no XState) that interprets pointer events into store mutations.

## 2. What this task is not
Not render code. Not undo/redo. Not metrics.

## 3. Scope

### In
- Slice state:
  - `vertices: Float32Array` (x, z pairs, flat).
  - `planeY: Metres`.
  - `mode: 'idle' | 'placing' | 'closed' | 'editing'`.
  - `editingVertex: number | null`.
- Slice actions:
  - `startPlacing(planeY)`, `addVertex(x, z)`, `close()`, `cancel()`.
  - `beginEditVertex(i)`, `moveVertex(i, x, z)`, `endEditVertex()`, `deleteVertex(i)`.
- Drawer (`drawer.ts`):
  - Takes a `{ raycastToPlane: (x, y) => [x, z] | null }` port.
  - Pointer event handlers that call store actions depending on `mode`.
  - Hover state (not persisted) for near-vertex detection via a small spatial lookup.

### Out
- Rendering, keyboard shortcuts, history. Those are the next tasks.

## 4. Tools and technology
Zustand 5, TypeScript discriminated unions.

## 5. Public surface
```ts
export { usePolygonStore, polygonSlice };
export { createDrawer };
export type { PolygonMode, PolygonSliceState };
```

## 6. Code structure delta
```
+ src/state/slices/polygon.slice.ts   (fleshed out)
+ src/polygon/drawer.ts
+ src/polygon/index.ts
+ tests/unit/polygon/slice.test.ts
+ tests/unit/polygon/drawer.test.ts
```

## 7. Design patterns
- **Finite state machine** — one `mode`, strict allowed transitions.
- **Dependency inversion** — drawer takes a `raycastToPlane` port; the real one is injected by the renderer later.
- **Single source of truth** — vertices live in the store, not in a mesh.

## 8. Best practices and references
- Hand-rolled FSMs over flags — David Khourshid's writing on invalid states.
- Zustand slice pattern — Daishi Kato.
- `useSyncExternalStore` under Zustand — Andrew Clark's design notes.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | New store starts in `mode === 'idle'` with 0 vertices | Vitest |
| T02 | `startPlacing(10)` moves to `placing` and sets `planeY = 10` | Vitest |
| T03 | `addVertex(1,1)` in `placing` appends `(1,1)` | Vitest |
| T04 | `addVertex` in `idle` is a no-op | Vitest |
| T05 | `close()` requires ≥ 3 vertices; otherwise cancels | Vitest |
| T06 | `beginEditVertex(i)` on a closed polygon moves to `editing` with `editingVertex = i` | Vitest |
| T07 | `moveVertex(i, x, z)` while editing updates buffer in place; a different `i` is a no-op | Vitest |
| T08 | `cancel()` from any mode returns to `idle` and clears vertices (except from `closed`, where it keeps them) | Vitest |
| T09 | Drawer: pointerdown with `raycastToPlane` returning null is a no-op | Vitest |
| T10 | Drawer: dblclick in `placing` with ≥ 3 vertices closes | Vitest |
| T11 | Drawer: Alt-click near a vertex in `closed` deletes it (and reverts to `placing` if < 3 remain) | Vitest |

## 10. Done means
- All tests pass.
- The slice is pure (no DOM, no Three.js) and runs under the Vitest `node` project.
