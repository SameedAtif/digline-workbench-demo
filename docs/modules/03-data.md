# Module 03 — `data`

> **As-built:** this module is implemented. See `docs/IMPLEMENTATION.md` for final architecture and deviations from this plan.

Everything to do with getting a `BlockModel` into memory. Two sources: a seeded synthetic generator and a CSV importer that runs in a Web Worker.

> Inherits from `PROJECT.md`.

---

## 1. What this module is

- A deterministic bench generator that returns a `BlockModel` from a seed and a few parameters (bench dimensions, cell size, ore-body shape, grade distribution).
- A Web Worker that parses CSV with PapaParse, validates each row with Zod, and transfers a `BlockModel` back through a `Transferable` typed-array handoff.
- A thin UI-agnostic facade used by `state/` to swap models in or out.

## 2. What this module is not

- Not a renderer or UI. The drag-and-drop handler itself lives in `ui/Viewport.tsx` later; this module exposes the parser only.
- Not a general-purpose CSV library. It understands exactly one schema.
- Not a persistence layer. The last model is kept in memory in `state/`, not written to disk.

## 3. Scope

### In scope
- `generateBench({ seed, nx, ny, nz, cellSize, oreShape, ... }) → BlockModel`.
- `parseCSV(file: File) → Promise<BlockModel>` running inside a worker.
- Schema validation with Zod and a per-file summary of rejected rows (count, first 5 reasons).
- Transfer of the resulting typed-array buffers to the main thread without copying.
- A small set of fixtures used by tests across the project.
- A downloadable sample CSV in `public/sample-blocks.csv`.

### Out of scope
- Any format beyond CSV (no DXF, no Datamine, no GeoTIFF).
- Streaming parse past the first chunk. If a file is bigger than ~250 MB the worker says so and refuses.
- Reading remote URLs.

## 4. Tools and technology

| Thing | Choice |
|---|---|
| CSV | PapaParse 5 inside a Web Worker |
| Validation | Zod 3 |
| Transfer | `postMessage` with `transferList = [buffer1, buffer2, …]` |
| Worker type | ES-module worker, `new Worker(url, { type: 'module' })` |

## 5. Features the rest of the app will consume

```ts
import { generateBench, parseCSV, BenchParams } from '@/data';
```

## 6. Code structure

```
src/data/
├── index.ts
├── generator.ts       # pure, synchronous; builds BlockModel from a seed
├── schema.ts          # Zod schema for a CSV row
├── protocol.ts        # worker message/result types and limits
├── csv-parse.ts       # pure, testable parse seam
├── csv.ts             # main-thread wrapper: spawns worker, awaits result
├── csv.worker.ts      # the worker itself
└── __fixtures__/
    ├── tiny.csv
    ├── malformed.csv
    └── 50k.csv.gz     # committed as a gzip to keep the repo small
```

## 7. Design patterns

- **Factory** — both `generateBench` and `parseCSV` return a `BlockModel` through the same `createBlockModel` factory from `domain`. Downstream code is source-agnostic.
- **Worker-as-service** — one worker, one message type in, one out. No channels, no RPC framework.
- **Fail-closed validation** — the worker never partially succeeds. Either it returns a valid `BlockModel` or a `{ kind: 'error', summary }` message.

## 8. Best practices and references

- **Transferable `ArrayBuffer`s** — Jason Miller (preact / web-perf) on moving data between threads without copying; MDN on `Transferable`.
- **PapaParse in a worker** — Matt Holt's (PapaParse author) docs on worker mode.
- **Zod schemas as parse-don't-validate** — Alexis King's "Parse, don't validate" essay; Colin McDonnell's Zod docs reflect it.
- **Seeded synthetic data** — the generator is deterministic because reproducibility beats novelty for a portfolio demo (point made by Julia Evans in multiple posts on debugging).

## 9. Done means

- `generateBench` with a fixed seed produces an identical model byte-for-byte across runs.
- `parseCSV(tiny.csv)` returns a 10-block `BlockModel` within 50ms end-to-end.
- `parseCSV(malformed.csv)` resolves to an error object, not a throw, and the summary names the first failing row and reason.
- The worker thread never blocks the main thread for more than 16ms per message tick (measured with `performance.measure`).

## 10. Tasks (ordered)

1. `docs/tasks/03-data/01-generator.md` — deterministic bench generator + fixtures.
2. `docs/tasks/03-data/02-csv-worker.md` — Zod schema, worker body, transferable handoff.
3. `docs/tasks/03-data/03-importer-facade.md` — main-thread wrapper, error summary, unit tests.
