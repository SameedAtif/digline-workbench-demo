# Module 08 — `uncertainty`

The feature that makes the demo feel honest: an ensemble of perturbed vector fields renders a translucent band around the polygon, showing where the dig line could plausibly end up. Also where a Playwright smoke test and the README's performance numbers live.

> Inherits from `PROJECT.md`.

---

## 1. What this module is

- An `Ensemble` of N (default 10) `PerturbedField` instances produced from a seeded jitter of the base field.
- A visualisation layer that renders each ensemble member's polygon outline at low opacity, so the overlap forms a band.
- A toggle in the UI; off by default to keep the base demo clean.
- The project's single Playwright smoke test: boot the app, scrub, enable uncertainty, check a canvas pixel changed.

## 2. What this module is not

- Not statistical inference. Perturbations are additive Gaussian noise with a user-visible sigma slider.
- Not a Monte Carlo physics simulation.
- Not an alternative to measurement. The README states this plainly.

## 3. Scope

### In scope
- Deterministic ensemble generation: given `(baseField, seed, N, sigma)` the ensemble is reproducible.
- Shared displacement shader across all ensemble polygons; each one picks its member via an instanced attribute index.
- A single `InstancedMesh` of `Line2` segments for all ensemble outlines (one draw, N instances).
- Toggle, member count, sigma — three UI controls behind a disclosure panel.
- One Playwright smoke test asserting the band appears when toggled.

### Out of scope
- Confidence intervals, p-values, calibration curves.
- Any ML-style training.
- Any export of ensemble statistics.

## 4. Tools and technology

| Thing | Choice |
|---|---|
| Jitter | `mulberry32` + Box-Muller for normal noise, reusing `prng.ts` from `domain` |
| Lines | `Line2` segments, instanced per ensemble member |
| E2E | Playwright 1.49, one test file, headless Chromium |

## 5. Features the rest of the app will consume

```ts
import { createEnsemble, Ensemble } from '@/uncertainty';
import { EnsembleBand } from '@/render/uncertainty';
```

## 6. Code structure

```
src/uncertainty/
├── index.ts
├── ensemble.ts        # ensemble construction, PerturbedField factory
└── toggle.tsx         # Radix switch + sigma slider

src/render/uncertainty/
├── index.ts
├── ensemble-band.ts   # one draw call for N perturbed polygons
└── band.vert.glsl     # per-instance seed → noise → displacement

tests/e2e/
└── smoke.spec.ts      # Playwright single-shot smoke
```

## 7. Design patterns

- **Strategy** — reuses `VectorField` from `domain`; `PerturbedField` wraps a base field.
- **Observer** — toggle writes to the store; renderer subscribes.
- **Composition over inheritance** — the band renderer composes the existing polygon shader rather than duplicating displacement logic.

## 8. Best practices and references

- **Reusing a seeded PRNG for reproducibility** — Tommy Ettinger's PRNG survey; keeps CI deterministic.
- **Box-Muller transform** — Marsaglia's original paper, still the standard.
- **One Playwright smoke test over a brittle E2E suite** — Andrey Lushnikov's "Flakiness-free Playwright" talk.
- **Instanced lines for ensembles** — Garrett Johnson's `three-mesh-bvh` and `Line2` discussions on the Three.js forum.

## 9. Done means

- Toggling uncertainty on a 20-vertex polygon shows a visibly wider band at larger sigma.
- Sigma slider updates the band at 60fps.
- Playwright smoke test passes locally and in CI in under 20 seconds.
- README has the live link, measured FPS numbers for 100k / 250k / 500k blocks, and a 90-second recording link.

## 10. Tasks (ordered)

1. `docs/tasks/08-uncertainty/01-ensemble.md` — `PerturbedField`, deterministic jitter, ensemble construction.
2. `docs/tasks/08-uncertainty/02-band-render.md` — instanced polygon lines, shared shader, UI toggle.
3. `docs/tasks/08-uncertainty/03-smoke-test.md` — Playwright smoke, README numbers, final polish pass.
