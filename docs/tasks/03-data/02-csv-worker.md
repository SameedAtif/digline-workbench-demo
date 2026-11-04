# Task 03.02 — CSV worker

Parse a user CSV into a `BlockModel` inside a Web Worker. Never block the main thread. Never return a partially-valid model.

> Inherits from `docs/modules/03-data.md`.

---

## 1. What this task is
`csv.worker.ts` and its message protocol: receive a `File`, respond with either a `BlockModel` (transferred buffers) or an error summary.

## 2. What this task is not
Not the main-thread facade (next task) and not drag-and-drop (module 05 / UI).

## 3. Scope

### In
- Message protocol:
  - In: `{ kind: 'parse'; file: File; options?: { density?: number } }`.
  - Out success: `{ kind: 'ok'; model: { count, x, y, z, size, grade, material, tonnes } }` — all typed arrays sent via `transferList`.
  - Out error: `{ kind: 'error'; summary: { total, rejected, reasons: Array<{ line, reason }> (first 5) } }`.
- Expected CSV columns: `x, y, z, size, grade, material` (header required; order flexible).
- Zod schema validates each row; invalid rows are counted, not thrown.
- Tonnes computed as `size³ * density` (default 2.7 t/m³).
- Hard limits: file size ≤ 250 MB; row count ≤ 2,000,000.

### Out
- Encoding detection beyond UTF-8.
- Zipped CSV.
- Streaming into a progressive model (parse completes, then the whole model is handed over).

## 4. Tools and technology
PapaParse (worker mode), Zod, ES-module Web Worker.

## 5. Code structure delta
```
+ src/data/schema.ts
+ src/data/csv.worker.ts
+ tests/unit/data/schema.test.ts
+ tests/unit/data/worker.test.ts   # drives the worker via `new Worker(...)` in jsdom w/ `jsdom-worker` polyfill, or uses Vitest's `--pool=threads` with a direct import of the handler
```

## 6. Design patterns
- **Fail-closed** — one return shape per outcome; the worker never partially succeeds.
- **Transferable handoff** — buffers move, they are not copied.
- **Pure handler** — the worker's message handler delegates to a pure `parseBuffer(buffer)` so it can be unit-tested without a `Worker`.

## 7. Best practices and references
- PapaParse workers — Matt Holt's PapaParse docs.
- Transferable `ArrayBuffer`s — MDN; Surma's "The Hard Parts of Shared Workers".
- Zod as `parse` (not `validate`) — Alexis King's "Parse, don't validate".

## 8. Test cases

| # | Test | How |
|---|---|---|
| T01 | A valid 10-row CSV returns `{ kind: 'ok', model.count === 10 }` | Vitest, pure handler |
| T02 | A CSV with a missing `grade` header rejects the whole file with reason `"missing header: grade"` | Vitest |
| T03 | A CSV with 3 rows where row 2 has `grade = "abc"`: `rejected = 1`, first reason names line 2 | Vitest |
| T04 | A file > 250 MB rejects with reason `"file too large"` (mock File) | Vitest |
| T05 | `tonnes` defaults to `size³ * 2.7` | Vitest |
| T06 | Buffers in the success message are `Transferable` and detach from the worker scope | Vitest, assert `buffer.byteLength === 0` on worker side after `postMessage` with transferList |
| T07 | Parsing 50k rows completes in under 1s in a Node test env | Vitest, soft threshold |
| T08 | A CSV with NaN in `x` rejects that row and continues; summary names the line | Vitest |
| T09 | The output buffers equal those produced by `generateBench` when fed its CSV dump of the same bench | Vitest, round-trip |

## 9. Done means
- The worker runs in isolation and never calls into DOM APIs.
- No unhandled promise rejections in the test logs.
- A malformed file never throws across the message boundary.
