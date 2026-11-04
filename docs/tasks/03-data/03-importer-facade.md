# Task 03.03 — Importer facade

The main-thread wrapper over the worker. One function. A friendly API for `ui/` and `state/` to call. Takes a `File`, returns a `Promise<BlockModel>` or a typed error.

> Inherits from `docs/modules/03-data.md`.

---

## 1. What this task is
`parseCSV(file: File): Promise<ImportResult>` plus the small `ImportResult` discriminated union.

## 2. What this task is not
Not a UI toast or notification. Not a drag-and-drop handler.

## 3. Scope

### In
- Lazy worker spawn on first call; reused for subsequent calls within the session.
- Clean cancellation via `AbortSignal`.
- Timeout handling: if the worker does not respond in 60s, resolve with `{ kind: 'error', reason: 'timeout' }`.
- `ImportResult = { kind: 'ok', model } | { kind: 'error', summary }`.
- Reconstruction of `BlockModel` on the main thread using `createBlockModel` from `domain`, so invariants are checked once more.

### Out
- UI integration.
- Persistence of the imported model beyond returning it.

## 4. Tools and technology
TypeScript, `AbortController`, Vitest.

## 5. Public surface
```ts
export { parseCSV };
export type { ImportResult, ImportError };
```

## 6. Code structure delta
```
+ src/data/csv.ts
+ tests/unit/data/csv.test.ts
```

## 7. Design patterns
- **Facade** — collapses the message-passing dance into a Promise.
- **Lazy singleton** — the worker is instantiated on first use and terminated on `dispose()` (called from `state/` on unload).

## 8. Best practices and references
- `AbortSignal` ergonomics — Jake Archibald's "The ultimate guide to abortable fetch".
- Promise-wrapping a worker — Nolan Lawson's "comlink-vs-plain-postMessage" post (we go plain to avoid the dependency).

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `parseCSV(validFile)` resolves to `{ kind: 'ok', model }` and `model` passes `createBlockModel` invariants | Vitest |
| T02 | `parseCSV(malformedFile)` resolves to `{ kind: 'error', summary }` without throwing | Vitest |
| T03 | Calling `parseCSV` twice reuses the same `Worker` instance (checked via a spy on `new Worker`) | Vitest |
| T04 | Aborting mid-parse via `AbortSignal` resolves to `{ kind: 'error', reason: 'aborted' }` | Vitest |
| T05 | A worker timeout returns `{ kind: 'error', reason: 'timeout' }` after 60s (fake timers) | Vitest |
| T06 | Terminating the worker (via `disposeImporter()`) and calling `parseCSV` again spawns a new worker | Vitest |
| T07 | The returned `model.x` is a `Float32Array` with `byteLength > 0` (buffers survived the transfer) | Vitest |

## 10. Done means
- The facade's unit tests pass under both Vitest `node` (where we mock Worker) and `jsdom` (real `Worker` where available).
- No `any` in the public surface; errors are typed.
