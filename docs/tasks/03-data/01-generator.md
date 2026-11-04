# Task 03.01 — Synthetic bench generator

A deterministic, seeded function that builds a `BlockModel` for a synthetic open-pit bench. The default demo loads from this; later CSV import replaces it.

> Inherits from `docs/modules/03-data.md`.

---

## 1. What this task is
`generateBench(params) → BlockModel` producing a realistic-looking bench: a rectangular grid of blocks with an ore body threaded through it (lognormal-distributed grade, a modelled "free face" on one side), and material ids (ore / waste / low-grade).

## 2. What this task is not
Not a procedural geology simulator. The ore body is a soft 3D ellipsoid blob with lognormal grade; it is not Gaussian simulation.

## 3. Scope

### In
- `BenchParams`: `{ seed, nx, ny, nz, cellSize, orebodyCenter, orebodyRadius, meanGrade, cutoff, density, faceAxis }`.
- Rectangular grid of block centroids at `(ix + 0.5) * cellSize`, etc.
- Grade from a lognormal centred on `meanGrade`, modulated by a smooth ellipsoid falloff from `orebodyCenter`.
- Material: `ore` if `grade ≥ cutoff`, else `waste`, with a 5% "low-grade" band near the cutoff.
- Tonnes = `cellSize³ * density` per block.
- Fixtures for sizes: `tiny` (10×10×1 = 100 blocks), `small` (50³ = 125k), `big` (80×80×8 ≈ 500k).

### Out
- Loading from a file.
- Non-rectangular bench shapes.
- Multi-bench pits.

## 4. Tools and technology
TypeScript, `mulberry32` + `normal` from task 02.01, Vitest, fixtures committed as deterministic JSON snapshots of the first row of each size.

## 5. Public surface
```ts
export { generateBench };
export type { BenchParams };
```

## 6. Code structure delta
```
+ src/data/generator.ts
+ src/data/index.ts
+ tests/unit/data/generator.test.ts
+ tests/fixtures/bench-tiny.hash.json   # sha256 of each buffer for determinism check
```

## 7. Design patterns
- **Deterministic generators** — a seed is required; no `Date.now()`, no `Math.random()`.
- **Shape via field** — grade is a smooth function sampled at centroid, so lowering `cellSize` smoothly refines detail.

## 8. Best practices and references
- Lognormal grade distributions — Journel & Huijbregts, *Mining Geostatistics*, chapter 1 (background). Our implementation is a toy.
- Reproducible fixtures via hash — Simon Willison's writing on "golden file" tests.

## 9. Test cases

| # | Test | How |
|---|---|---|
| T01 | `generateBench({ seed: 1, nx: 10, ny: 10, nz: 1, ... })` returns a `BlockModel` with 100 blocks | Vitest |
| T02 | Same params ⇒ byte-identical buffers across runs | Vitest, hash compare |
| T03 | Different seeds ⇒ different grade buffers | Vitest |
| T04 | Changing `cellSize` scales tonnes by `cellSize³` | Vitest |
| T05 | All `grade` values ≥ 0 and finite | Vitest |
| T06 | Mean grade of all blocks is within ±10% of `meanGrade` for `nx=ny=50, nz=5` | Vitest, statistical |
| T07 | `big` fixture generates under 300ms on CI | Vitest, soft threshold |
| T08 | `material` only takes the three allowed ids | Vitest, set-equality |

## 10. Done means
- All tests pass.
- Generator is pure (no imports from `render/`, `ui/`, `state/`).
- Hash fixtures committed; a future change that alters the output will fail CI loudly.
