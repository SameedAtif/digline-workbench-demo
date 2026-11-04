# Task 02.03 — Metrics

Tonnes inside the polygon, mean grade, dilution and ore-loss percentages, all as pure functions on `(BlockModel, Polygon, t, baseline)`.

> Inherits from `docs/modules/02-domain.md`.

---

## 1. What this task is
Four functions that answer: "if the geologist's polygon follows the blast, how much ore is still inside it, how clean is it, and how much have they lost?"

## 2. What this task is not
Not a renderer, not a React panel. Not economic — no $/tonne, no revenue uplift.

## 3. Scope

### In
- `baselineOre(model, polygon0, cutoff)`: snapshot of which block indices are "ore" at `t=0`, inside `polygon0`, with grade ≥ cutoff. Returns a `Uint32Array` of indices and total tonnes/grade for later comparison.
- `polygonTonnes(model, polygon, field, t, cutoff)`: tonnes of ore (grade ≥ cutoff) whose post-blast centroid lies inside the deformed polygon.
- `polygonMeanGrade(...)`: tonnage-weighted mean grade of those blocks.
- `dilution(model, polygon, field, t, baseline, cutoff)`: fraction (0..1) of tonnes inside the polygon at time `t` that were NOT part of the baseline ore.
- `oreLoss(model, polygon, field, t, baseline, cutoff)`: fraction (0..1) of baseline-ore tonnes whose post-blast centroid is NOT inside the deformed polygon.

### Out
- Weighted-by-face-area, kriging, geostatistics.
- Material-mixing matrices beyond ore/waste.

## 4. Tools and technology
TypeScript, Vitest, `fast-check`.

## 5. Public surface
```ts
export { baselineOre, polygonTonnes, polygonMeanGrade, dilution, oreLoss };
export type { Baseline };
```

## 6. Code structure delta
```
+ src/domain/metrics.ts
+ tests/unit/domain/metrics.test.ts
```

## 7. Design patterns
- **Pre-computed baseline** — `Baseline` is computed once at `t=0` and reused for every scrub tick, avoiding O(N) per frame on the UI side.
- **Composition** — metrics call `deformPolygon` and `applyField` from task 02.02; they do not re-derive geometry.

## 8. Best practices and references
- Dilution and ore-loss definitions — Thornton (2005) and the AusIMM paper on blast movement modelling (both cited in the README).
- Tonnage-weighted means — standard practice in grade control; mentioned in Hartman & Mutmansky's "Introductory Mining Engineering".
- Monotone-contract tests — John Hughes on property-based testing identities.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | On `t=0`, `polygonTonnes` equals the sum of baseline tonnes | Vitest |
| T02 | On `t=0`, `dilution = 0` and `oreLoss = 0` | Vitest |
| T03 | Doubling every block's tonnes doubles `polygonTonnes` | fast-check |
| T04 | `polygonMeanGrade` of a single-block polygon equals that block's grade | Vitest |
| T05 | On a uniform field with the polygon translated by the same vector, `polygonTonnes(t=1) == polygonTonnes(t=0)` within rounding | Vitest |
| T06 | `dilution + oreLoss ≤ 2` and both ∈ [0,1] under all generated inputs | fast-check |
| T07 | A field that moves everything out of the polygon gives `oreLoss ≈ 1`, `polygonTonnes ≈ 0` | Vitest |
| T08 | Changing `cutoff` from 0.5 to 1.0 can only decrease baseline ore tonnes | fast-check (monotonicity) |

## 10. Done means
- All tests pass.
- `metrics.ts` runs under 5ms on 500k blocks + a 50-vertex polygon in a Node bench (not asserted in CI, documented in README).
