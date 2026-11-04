# Task 08.01 — Ensemble construction

A seeded ensemble of `PerturbedField` instances derived from the active base field. Pure domain code; no rendering.

> Inherits from `docs/modules/08-uncertainty.md`.

---

## 1. What this task is
`createEnsemble({ base, seed, size, sigma }) → Ensemble`: an immutable array of `VectorField` instances suitable for feeding into `deformPolygon` N times.

## 2. What this task is not
Not render. Not UI. Not Playwright.

## 3. Scope

### In
- `Ensemble = ReadonlyArray<VectorField>`.
- `createEnsemble` iterates `size` times, deriving a child `prng` from the parent seed (`seed + i`), producing `PerturbedField({ base, prng, sigma })` for each.
- Guards: `size` ∈ [1, 64]; `sigma` ∈ [0, 10].
- `ensembleOutlines(polygon, ensemble, t) → Float32Array` producing a flat array of per-member outline vertex positions for the renderer (laid out as `member * vertexCount * 2`).

### Out
- Any shader uniform or draw.
- Any UI control.

## 4. Tools and technology
TypeScript, `fast-check`, Vitest.

## 5. Public surface
```ts
export { createEnsemble, ensembleOutlines };
export type { Ensemble, EnsembleParams };
```

## 6. Code structure delta
```
+ src/uncertainty/ensemble.ts
+ src/uncertainty/index.ts
+ tests/unit/uncertainty/ensemble.test.ts
```

## 7. Design patterns
- **Factory** — one function, parameterised.
- **Immutability** — the `Ensemble` is `readonly`.
- **Composition** — reuses `PerturbedField` from `domain`.

## 8. Best practices and references
- Deterministic ensembles for reproducibility — Tommy Ettinger on seed derivation.
- Avoiding seed collisions via arithmetic — classic PRNG practice.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `createEnsemble({ size: 10, ... })` returns 10 fields | Vitest |
| T02 | Same `seed` ⇒ byte-equal `ensembleOutlines` across runs | Vitest |
| T03 | `sigma = 0` ⇒ every member outline equals `deformPolygon(polygon, base, t)` | Vitest |
| T04 | Increasing `sigma` increases the standard deviation of outlines (bounding box area variance) | fast-check |
| T05 | `size = 0` throws with a clear message | Vitest |
| T06 | `size > 64` throws | Vitest |
| T07 | `ensembleOutlines` output length = `size * vertexCount * 2` | Vitest |

## 10. Done means
- Pure, deterministic, tested.
- No imports outside `domain/` and `uncertainty/`.
