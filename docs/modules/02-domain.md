# Module 02 — `domain`

Pure TypeScript. The brain of the app. No React, no Three.js, no DOM. If a browser ever disappeared, this module would still compile and its tests would still pass.

> Inherits from `PROJECT.md`.

---

## 1. What this module is

A set of typed data structures and pure functions covering:

- `Block`, `BlockModel` (columnar storage over typed arrays).
- `Polygon` on a plane, with vertex, edge and area operations.
- `VectorField` (a `Strategy` with a `sample(x, y, z) → Vec3` method).
- Metrics: tonnes in polygon, mean grade, dilution %, ore-loss %.
- Units via branded types (`Metres`, `Tonnes`, `GramsPerTonne`, `Density`).

Every function is total, deterministic, and side-effect free.

## 2. What this module is not

- Not a renderer, store, or UI.
- Not a physics engine. `VectorField` is a function, not a simulator.
- Not a persistence layer. It does not know what a file is.
- Not aware of time. No clocks, no `Date.now()`.

## 3. Scope

### In scope
- Columnar `BlockModel` with: `x`, `y`, `z` (centroid), `size`, `grade`, `material`, `tonnes` as parallel typed arrays, plus `count`.
- Factory `createBlockModel(buffers)` with runtime invariants (equal lengths, finite numbers).
- `VectorField` strategy interface + three implementations: `UniformField`, `FreeFaceField`, `PerturbedField`.
- `applyField(model, field, t) → BlockModel` returning a shallow-copied model with updated positions (buffers reused where safe, copied where not).
- Polygon ops: `area`, `centroid`, `pointInPolygon`, `bufferedBoundingBox`.
- Polygon deformation: `deformPolygon(polygon, field, t) → Polygon`.
- Metrics on (model, polygon, t): `polygonTonnes`, `polygonMeanGrade`, `dilution`, `oreLoss` — comparing the baseline (t=0) ore classification to post-blast positions.

### Out of scope
- Any I/O. Parsing CSV lives in `data`.
- Any GPU buffer concepts.
- Any serialisation format.

## 4. Tools and technology

| Thing | Choice |
|---|---|
| Language | TypeScript 5.6 strict |
| Random | A seeded PRNG (`mulberry32`) hand-rolled in `prng.ts` |
| Test | Vitest `node` project |
| Property tests | `fast-check` |
| Benchmarks | Vitest's `bench` for `applyField` on 500k blocks |

## 5. Features the rest of the app will consume

```ts
import {
  BlockModel, createBlockModel,
  Polygon, deformPolygon,
  VectorField, UniformField, FreeFaceField, PerturbedField,
  applyField,
  polygonTonnes, polygonMeanGrade, dilution, oreLoss,
  Metres, Tonnes, GramsPerTonne, mulberry32,
} from '@/domain';
```

## 6. Code structure

```
src/domain/
├── index.ts
├── units.ts              # branded types + constructors
├── prng.ts               # mulberry32
├── block.ts              # BlockModel + factory + invariants
├── polygon.ts            # Polygon + area/centroid/point-in-polygon
├── vector-field.ts       # VectorField strategy + 3 impls
├── apply.ts              # applyField, deformPolygon
└── metrics.ts            # tonnes/grade/dilution/ore-loss
```

## 7. Design patterns

- **Strategy** — `VectorField` is an interface; implementations are swappable, which is what the uncertainty ensemble will exploit.
- **Data-oriented storage** — `BlockModel` holds parallel `Float32Array`s, not an array of objects. Everything downstream reads these buffers directly.
- **Pure functions** — every exported function is pure. State lives elsewhere.
- **Smart constructors** — `createBlockModel` and `createPolygon` validate invariants once; downstream code trusts the types.

## 8. Best practices and references

- **Data-oriented design** on JS typed arrays — Mike Acton's "Data-Oriented Design and C++" talk, applied to the browser.
- **Discriminated unions for `VectorField`** — Anders Hejlsberg's design notes; Matt Pocock's TypeScript lessons.
- **Property-based testing of geometry** — Nicolas Dubien's `fast-check` docs, chapter on arbitraries.
- **Seeded PRNG for reproducible test fixtures** — Tommy Ettinger's survey of small PRNGs (`mulberry32` recommended for 32-bit JS).
- **Point-in-polygon** — Dan Sunday's crossing-number algorithm, cited in every geometry library and used by `earcut`.

## 9. Done means

- 100% statement coverage on `domain/` with a Vitest coverage threshold enforced.
- Property tests pass 1000 runs on polygon area/centroid identities.
- `applyField` on 500k blocks completes under 20ms in the Node benchmark on CI hardware.
- Zero imports from outside the module in `domain/`.

## 10. Tasks (ordered)

1. `docs/tasks/02-domain/01-types.md` — units, PRNG, `BlockModel`, `Polygon`.
2. `docs/tasks/02-domain/02-vector-field.md` — `VectorField` strategy + three implementations + `applyField`/`deformPolygon`.
3. `docs/tasks/02-domain/03-metrics.md` — tonnes, grade, dilution, ore-loss.
