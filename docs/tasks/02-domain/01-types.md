# Task 02.01 — Types, PRNG, BlockModel, Polygon

Lay down the data structures the rest of the project builds on. Pure TypeScript, no browser APIs.

> Inherits from `docs/modules/02-domain.md`.

---

## 1. What this task is
Branded unit types, a seeded PRNG, the columnar `BlockModel` with its smart constructor, and `Polygon` with core geometry ops.

## 2. What this task is not
Not vector fields, not metrics, not `applyField` — those are the next two tasks. No file I/O.

## 3. Scope

### In
- `units.ts` with branded types `Metres`, `Tonnes`, `GramsPerTonne`, `Density`, `MaterialId` and constructors (`metres(n)`, …) that assert `Number.isFinite`.
- `prng.ts` with `mulberry32(seed: number) → () => number` and a `normal(prng)` using Box-Muller.
- `block.ts`:
  - `type BlockModel = { count, x, y, z, size, grade, material, tonnes }` with typed-array fields.
  - `createBlockModel(buffers) → BlockModel` validating equal lengths and finite values.
  - `cloneBlockModel(model)` (shallow structural, used by `applyField` next task).
- `polygon.ts`:
  - `type Polygon = { vertices: Float32Array (x,z pairs, flat), closed: boolean, planeY: Metres }`.
  - `createPolygon(vertices, planeY)`.
  - `area(polygon)` via shoelace.
  - `centroid(polygon)`.
  - `pointInPolygon(polygon, x, z)` via crossing number.
  - `aabb(polygon)`.

### Out
- Vector-field types.
- Any deformation.
- Metrics.

## 4. Tools and technology
TypeScript, Vitest, `fast-check` for property tests.

## 5. Public surface
```ts
export type { Metres, Tonnes, GramsPerTonne, Density, MaterialId };
export { metres, tonnes, gramsPerTonne, density, materialId };
export { mulberry32, normal };
export type { BlockModel, Polygon };
export { createBlockModel, cloneBlockModel };
export { createPolygon, area, centroid, pointInPolygon, aabb };
```

## 6. Code structure delta
```
+ src/types/index.ts
+ src/domain/units.ts
+ src/domain/prng.ts
+ src/domain/block.ts
+ src/domain/polygon.ts
+ src/domain/index.ts
+ tests/unit/domain/units.test.ts
+ tests/unit/domain/prng.test.ts
+ tests/unit/domain/block.test.ts
+ tests/unit/domain/polygon.test.ts
```

## 7. Design patterns
- **Branded primitives** — compile-time unit safety at zero runtime cost.
- **Smart constructors** — validate at the edge; trust internally.
- **Columnar storage** — one typed array per field, not an array of objects.

## 8. Best practices and references
- Branded types — Michał Mikołajczyk and the TS handbook pattern.
- `mulberry32` — Tommy Ettinger's PRNG recommendations.
- Shoelace area and crossing-number PiP — Dan Sunday's algorithm notes.
- Property-based testing of geometry — Nicolas Dubien's `fast-check` arbitraries doc.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `metres(NaN)` throws | Vitest |
| T02 | `mulberry32(42)` produces the same first 5 values across runs | Vitest, hard-coded expected array |
| T03 | `normal(prng)` over 10,000 samples has mean within ±0.05 of 0 and stddev within ±0.05 of 1 | Vitest |
| T04 | `createBlockModel` with mismatched array lengths throws | Vitest |
| T05 | `createBlockModel` with a NaN in `grade` throws | Vitest |
| T06 | `area` of a unit square = 1 | Vitest |
| T07 | `area` is invariant under translation (property test, 1000 runs) | fast-check |
| T08 | `area` is scaled by k² under uniform scale (property test) | fast-check |
| T09 | `pointInPolygon` on a convex polygon: centroid is inside; a far-away point is outside | fast-check |
| T10 | `pointInPolygon` edge cases: on-vertex, on-edge documented and consistent | Vitest, snapshot of behaviour |
| T11 | `aabb` matches `Math.min`/`Math.max` over vertices | Vitest |
| T12 | `cloneBlockModel` returns a new object with equal content and independent buffers | Vitest, mutate original and check clone |

## 10. Done means
- All tests pass. Coverage on `domain/*.ts` ≥ 95% statements.
- No file in this task imports anything outside `src/domain/` or `src/types/`.
