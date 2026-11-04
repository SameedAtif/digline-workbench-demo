# Task 02.02 — Vector fields and `applyField`

The strategy interface and three implementations, plus the pure functions that apply a field to a `BlockModel` and to a `Polygon`.

> Inherits from `docs/modules/02-domain.md`.

---

## 1. What this task is
A `VectorField` interface, three concrete fields, and the deterministic application of a field to both block positions and polygon vertices at a scrub parameter `t ∈ [0, 1]`.

## 2. What this task is not
Not a physics simulation. The fields are parameterised closed-form functions. No GPU work here; all pure CPU.

## 3. Scope

### In
- `VectorField` interface: `{ kind: string; sample(x, y, z) → [dx, dy, dz] }`.
- `UniformField({ dx, dz, dy? })`: constant translation, with gravity-biased vertical drop.
- `FreeFaceField({ facePoint, faceNormal, maxThrow, decay })`: throw decays with distance from free face, roughly inverse-square.
- `PerturbedField({ base: VectorField, prng, sigma })`: `base.sample(...)` plus Gaussian noise of stddev `sigma` (used by module 08 later).
- `applyField(model, field, t) → BlockModel`: produces a cloned model with `(x, y, z) += t * field.sample(x0, y0, z0)`.
- `deformPolygon(polygon, field, t) → Polygon`: same, but sampled at `(x, planeY, z)` for each vertex. Polygon stays open if input is open.

### Out
- Any rendering.
- Any time-varying field (`t` is a lerp parameter, not time).

## 4. Tools and technology
TypeScript, `fast-check`, Vitest `bench`.

## 5. Public surface
```ts
export type { VectorField };
export { UniformField, FreeFaceField, PerturbedField };
export { applyField, deformPolygon };
```

## 6. Code structure delta
```
+ src/domain/vector-field.ts
+ src/domain/apply.ts
+ tests/unit/domain/vector-field.test.ts
+ tests/unit/domain/apply.test.ts
+ tests/bench/apply.bench.ts
```

## 7. Design patterns
- **Strategy** — `VectorField` interface; implementations plug into the same `applyField`.
- **Immutable transform** — `applyField` returns a new `BlockModel`; the input is untouched.
- **Composition** — `PerturbedField` wraps any base field without knowing its concrete type.

## 8. Best practices and references
- Strategy pattern — GoF, directly applicable here.
- Inverse-distance kernels in blast movement — Thornton & Sprott, "Measuring Blast Movement to Reduce Ore Loss and Dilution" (ISEE, 2005), as background for the shape of `FreeFaceField`. The implementation is our own simplification; the paper is cited in the README.
- Vitest `bench` for CPU hot paths — Anthony Fu's docs.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `UniformField({ dx: 1, dz: 0 }).sample(…)` returns `[1, 0, 0]` for any input | Vitest |
| T02 | `applyField(model, UniformField({dx:1}), 0.5)` moves every x by 0.5 | Vitest |
| T03 | `applyField(..., t=0)` returns an equal model | fast-check: equal buffers |
| T04 | `applyField(..., t=1)` is reproducible: same inputs ⇒ byte-equal buffers | Vitest, deep equal |
| T05 | `FreeFaceField` throw decreases monotonically with distance along the face normal | fast-check |
| T06 | `FreeFaceField` throw at distance 0 ≤ `maxThrow` | Vitest |
| T07 | `PerturbedField` with `sigma=0` is identical to its base | Vitest |
| T08 | `PerturbedField` with the same `prng` seed produces the same output across runs | Vitest |
| T09 | `deformPolygon` preserves vertex count and `closed` flag | Vitest |
| T10 | `deformPolygon` on a closed convex polygon with uniform field preserves `area` within 1e-6 | Vitest |
| T11 | `applyField` on 500k blocks completes under 20ms on CI (Node 22, GH-hosted runner) | Vitest bench, threshold assertion |

## 10. Done means
- All tests pass; the benchmark asserts the ms threshold or fails loudly.
- `apply.ts` has no `for` loop that allocates inside (verified by reading, not tested).
