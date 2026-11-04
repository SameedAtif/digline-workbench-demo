# Task 07.03 — Undo/redo and handle dragging

Command-pattern history for every polygon edit, keyboard shortcuts, and the pointer logic that lets a vertex handle be dragged.

> Inherits from `docs/modules/07-polygon.md`.

---

## 1. What this task is
`history.ts` with `Command` interface and concrete `AddVertex`, `MoveVertex`, `DeleteVertex`, `Close` classes. Keyboard shortcuts. Handle drag.

## 2. What this task is not
Not metrics (last task).

## 3. Scope

### In
- `Command` interface: `{ do(store): void; undo(store): void }`.
- Four commands wrapping the store actions from task 07.01.
- `historyStack` and `redoStack` in the slice; `pushCommand`, `undo`, `redo` actions.
- Pointer logic on vertex handles via the picker shortcut (BVH on handle mesh — small, no GPU picking needed).
- Pointer drag on a handle issues `MoveVertex` commands (one on mouseup, with the start and end positions, so a drag is one undo step, not thousands).
- Keyboard:
  - `Ctrl/Cmd + Z` → `undo`.
  - `Shift + Ctrl/Cmd + Z` → `redo`.
  - `Esc` → `cancel` current draw.
  - `Alt + Click` on a handle issues `DeleteVertex`.
- `historyStack` capped at 200 entries (older dropped).

### Out
- Multi-polygon history branches.
- Persisting history across reloads.

## 4. Tools and technology
TypeScript, DOM `keydown` on `window`.

## 5. Code structure delta
```
+ src/polygon/history.ts
+ src/polygon/keyboard.ts
+ src/polygon/handle-drag.ts
+ src/state/slices/polygon.slice.ts   (updated: history fields)
+ tests/unit/polygon/history.test.ts
+ tests/unit/polygon/keyboard.test.ts
+ tests/unit/polygon/handle-drag.test.ts
```

## 6. Design patterns
- **Command** — classical GoF.
- **Memento (lightweight)** — each command stores just enough state to invert itself (e.g., `MoveVertex` keeps `from` and `to`).
- **Batch-on-release** — one `MoveVertex` command per drag, not per pointermove.

## 7. Best practices and references
- Command pattern — GoF.
- One-command-per-user-intent — Bret Victor's "Learnable Programming" on human-grained undo.
- Keyboard listener cleanup — Dan Abramov on effect cleanup.

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | `AddVertex.do` appends; `undo` pops | Vitest |
| T02 | `MoveVertex.do` writes new coords; `undo` restores old | Vitest |
| T03 | `DeleteVertex.do` removes vertex; `undo` reinserts at the same index | Vitest |
| T04 | `Close.do` sets mode `closed`; `undo` sets `placing` | Vitest |
| T05 | `undo` on empty stack is a no-op | Vitest |
| T06 | `redo` after a fresh command is cleared | Vitest |
| T07 | `historyStack` capped at 200; oldest commands drop | Vitest |
| T08 | A drag emits exactly 1 `MoveVertex` on pointerup, regardless of intermediate pointermove count | Vitest |
| T09 | `Ctrl+Z` on a focused window triggers `undo` | RTL |
| T10 | `Shift+Ctrl+Z` triggers `redo` | RTL |
| T11 | `Esc` in `placing` mode cancels | RTL |
| T12 | Keyboard listener is removed on unmount (no leak) | RTL |

## 9. Done means
- A drag-then-undo returns the vertex to its exact prior position (byte-equal).
- Rapid repeated undo/redo does not desync the mesh and the store.
